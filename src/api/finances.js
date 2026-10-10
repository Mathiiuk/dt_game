import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { isPreseason, preseasonAid } from '../domain/preseason'
import { ECONOMY, weeklyBudget, runwayWeeks, wageCapOf, balanceCheck } from '../domain/finances'

export const financesApi = {
  BALANCE: {
    base_members_count_tier_5: 350,
    member_weekly_due: 2.50,
    weekly_tv_rights_tier_5: 400,
    sponsor_base_weekly_tier_5: 750,
    stadium_base_maintenance_cost: 200,
    min_ticket_price: 5.0,
    max_ticket_price: 25.0,
    max_consecutive_deficit_weeks: 12
  },

  /**
   * Obtener estado financiero integral del club con desglose semanal y liquidez
   */
  async getFinances(clubId) {
    if (!clubId) return null

    return queryCache.fetch(`finances:${clubId}`, async () => {
      // Club, jugadores y staff son independientes: se piden juntos (antes eran tres idas y vueltas en fila)
      const [clubRes, playersRes, staffRes, firstFixtureDate] = await Promise.all([
        supabase.from('clubs').select('*').eq('id', clubId).single(),
        supabase.from('players').select('contract_salary').eq('club_id', clubId),
        supabase.from('staff').select('wage_weekly, salary').eq('club_id', clubId),
        this.firstFixtureDate(clubId)
      ])
      if (clubRes.error) throw new Error(clubRes.error.message)
      const club = clubRes.data
      const players = playersRes.data
      const staff = staffRes.data
      const week = weeklyBudget({ club, players: players || [], staff: staff || [] })
      const { playerWages, staffWages, stadiumMaint, academyMaint } = week.expenses
      const totalExpenses = week.totalExpenses
      const membersIncome = week.income.members
      const sponsorsIncome = week.income.sponsors
      const tvIncome = week.income.tv
      const storeIncome = week.income.store
      const totalRecurringIncome = week.totalIncome

      // 6. Taquilla proyectada si es local
      const ticketPrice = Number(club.ticket_price || 10.00)
      const stadiumCapacity = club.stadium_capacity || 1000
      const estimatedAttendance = Math.round(stadiumCapacity * 0.65)
      const projectedMatchdayGate = Math.round(estimatedAttendance * ticketPrice * (1 - ECONOMY.gateOperatingShare))

      // La taquilla se juega cada dos semanas en promedio: la mitad del neto por partido entra por semana
      const netWeeklyFlow = totalRecurringIncome - totalExpenses
      // En pretemporada no hay partidos: no se cuenta taquilla y sí el aporte de la dirigencia
      const preseason = isPreseason(club.game_date, firstFixtureDate)
      const boardAid = preseason ? preseasonAid(playerWages) : 0
      
      // Buscar si hay partido de local esta semana para calcular el flujo real
      const weekStart = new Date(club.game_date)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      
      const { data: homeFixtures } = await supabase
        .from('fixtures')
        .select('id')
        .eq('home_team_id', clubId)
        .gte('match_date', weekStart.toISOString())
        .lt('match_date', weekEnd.toISOString())
      
      const isHomeMatchThisWeek = homeFixtures && homeFixtures.length > 0
      
      const expectedWeeklyFlow = preseason 
        ? netWeeklyFlow + boardAid 
        : netWeeklyFlow + (isHomeMatchThisWeek ? projectedMatchdayGate : 0)

      const balance = Number(club.budget || 0)

      // 7. Estimación de liquidez
      let liquidityWeeks
      if (balance <= 0) {
        liquidityWeeks = 'Sin caja'
      } else if (expectedWeeklyFlow < 0) {
        const weeks = Math.max(1, Math.floor(runwayWeeks(balance, expectedWeeklyFlow)))
        liquidityWeeks = weeks > 52 ? 'Más de un año' : weeks === 1 ? '1 semana' : `${weeks} semanas`
      } else {
        liquidityWeeks = 'No se gasta'
      }

      // 8. Estado de salud financiera
      let healthStatus = 'HEALTHY'
      if (balance < 0) healthStatus = 'CRITICAL'
      else if (balance < 5000 || expectedWeeklyFlow < -500) healthStatus = 'CAUTION'

      return {
        balance,
        debt: club.debt || 0,
        ticketPrice,
        wageBudgetWeekly: wageCapOf(club),
        consecutiveDeficitWeeks: club.consecutive_deficit_weeks || 0,
        healthStatus,
        liquidityWeeks,
        expenses: {
          playerWages,
          staffWages,
          stadiumMaint,
          academyMaint,
          total: totalExpenses
        },
        income: {
          membersIncome,
          sponsorsIncome,
          tvIncome,
          storeIncome,
          projectedMatchdayGate,
          totalRecurring: totalRecurringIncome
        },
        netWeeklyFlow,
        expectedWeeklyFlow,
        preseason,
        boardAid,
        wageOverBudget: playerWages + staffWages > wageCapOf(club),
        monthlyProfit: expectedWeeklyFlow * 4
      }
    }, 20000)
  },

  /** Fecha del primer partido de liga del club (null si todavía no hay calendario) */
  async firstFixtureDate(clubId) {
    const { data } = await supabase
      .from('fixtures')
      .select('match_date')
      .or(`home_team_id.eq.${clubId},away_team_id.eq.${clubId}`)
      .order('match_date', { ascending: true })
      .limit(1)
    return data?.[0]?.match_date || null
  },

  /**
   * Cierre económico de la semana: ingresos recurrentes, sueldos, mantenimiento y, en pretemporada, el aporte de la dirigencia.
   * Lo calcula y lo escribe la base (`close_week_finances`) en una sola transacción y es idempotente por semana:
   * el navegador solo lo pide y no manda ningún importe.
   */
  async processWeek({ clubId, careerId = null, seasonYear = 1, weekNumber = 1 }) {
    const { data, error } = await supabase.rpc('close_week_finances', {
      p_club_id: clubId, p_season_year: seasonYear, p_week: weekNumber, p_career_id: careerId
    })
    if (error) throw new Error(error.message)
    queryCache.invalidate(`finances:${clubId}`)
    queryCache.invalidate(`club:${clubId}`)
    return {
      income: Number(data.income || 0) + Number(data.board_aid || 0),
      expenses: Number(data.expenses || 0),
      newBudget: Number(data.new_budget || 0),
      boardAid: Number(data.board_aid || 0),
      alreadyClosed: Boolean(data.already_closed)
    }
  },

  /**
   * Obtener el historial contable inmutable del libro mayor
   */
  async getLedgerTransactions(clubId, limit = 25) {
    if (!clubId) return []

    const { data, error } = await supabase
      .from('financial_transactions_ledger')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return data || []
  },

  /**
   * Ajustar el precio de la entrada general (Regla 20.4)
   */
  async updateTicketPrice(clubId, newPrice) {
    const price = Number(newPrice)
    if (isNaN(price) || price < this.BALANCE.min_ticket_price || price > this.BALANCE.max_ticket_price) {
      throw new Error(`El precio de la entrada debe estar entre $${this.BALANCE.min_ticket_price} y $${this.BALANCE.max_ticket_price}.`)
    }

    const { error } = await supabase
      .from('clubs')
      .update({ ticket_price: price })
      .eq('id', clubId)

    if (error) throw new Error(error.message)

    queryCache.invalidate(`finances:${clubId}`)
    queryCache.invalidate(`club:${clubId}`)
    return price
  },

  /**
   * Registrar una transacción inmutable en el libro mayor contable
   */
  async recordTransaction(clubId, careerId, category, amount, description) {
    if (!clubId) return
    // La caja y el asiento los mueve el servidor (la temporada y la semana salen de la fecha de juego del club)
    return this.moveCash({ clubId, careerId, category, amount: Number(amount), description, allowNegative: true })
  },

  /**
   * Verifica el balance: compara la caja del club con el último saldo del libro de movimientos. Solo lee, no cambia nada.
   * Devuelve { status: 'OK'|'DRIFT'|'EMPTY', drift, message, budget, ledgerBalance }.
   */
  async verifyBalance(clubId) {
    if (!clubId) return null
    const [clubRes, ledgerRes] = await Promise.all([
      supabase.from('clubs').select('budget').eq('id', clubId).single(),
      supabase.from('financial_transactions_ledger').select('balance_after').eq('club_id', clubId).order('created_at', { ascending: false }).limit(1)
    ])
    if (clubRes.error) throw new Error(clubRes.error.message)
    if (ledgerRes.error) throw new Error(ledgerRes.error.message)
    const budget = Number(clubRes.data?.budget || 0)
    const last = ledgerRes.data?.[0]?.balance_after
    const ledgerBalance = last === undefined || last === null ? null : Number(last)
    return { ...balanceCheck(budget, ledgerBalance), budget, ledgerBalance }
  },

  /**
   * Registra un asiento en el libro mayor SIN modificar la caja del club.
   * Se usa cuando el llamador ya actualizó clubs.budget (obras, aportes extraordinarios...);
   * balance_after refleja el saldo vigente del club en ese momento.
   */
  async recordLedgerTransaction({ clubId, careerId = null, category, amount, description, seasonYear = 1, weekNumber = 1 }) {
    if (!clubId) return

    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()

    const { error } = await supabase.from('financial_transactions_ledger').insert({
      career_id: careerId,
      club_id: clubId,
      season_year: seasonYear,
      week_number: weekNumber,
      category,
      amount,
      balance_after: Number(club?.budget || 0),
      description
    })
    if (error) console.warn('Aviso: no se pudo registrar el asiento contable:', error.message)

    queryCache.invalidate(`finances:${clubId}`)
  },

  /**
   * Mueve la caja del club en el servidor (`club_cash_move`): verifica fondos, actualiza la caja y escribe el asiento en una
   * transacción. Importe positivo = ingreso, negativo = gasto. `allowNegative` deja la caja en rojo (multas, consecuencias).
   * `ref` evita cobrar dos veces el mismo movimiento.
   */
  async moveCash({ clubId, amount, category, description, careerId = null, allowNegative = false, ref = null }) {
    const { data, error } = await supabase.rpc('club_cash_move', {
      p_club_id: clubId, p_amount: amount, p_category: category, p_description: description,
      p_career_id: careerId, p_allow_negative: allowNegative, p_ref: ref
    })
    if (error) throw new Error(error.message)
    queryCache.invalidate(`finances:${clubId}`)
    queryCache.invalidate('club:')
    return { newBudget: Number(data?.new_budget ?? 0), moved: Boolean(data?.moved) }
  },

  /**
   * Mejorar nivel de instalación edilicia
   */
  async upgradeFacility(clubId, facilityType, cost, currentLevel) {
    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    if (!club || club.budget < cost) throw new Error('Presupuesto insuficiente')

    // El cobro lo hace el servidor; el navegador solo sube el nivel de la instalación
    await this.moveCash({ clubId, amount: -cost, category: 'FACILITY', description: `Mejora de instalaciones (${facilityType}) al nivel ${currentLevel + 1}` })
    const { error } = await supabase.from('clubs').update({ [facilityType]: currentLevel + 1 }).eq('id', clubId)
    if (error) {
      // Si el nivel no se pudo guardar se devuelve el cobro
      await this.moveCash({ clubId, amount: cost, category: 'REFUND', description: `Devolución por mejora no aplicada (${facilityType})`, allowNegative: true }).catch(() => {})
      throw new Error(error.message)
    }

    queryCache.invalidate('finances:')
    queryCache.invalidate('club:')
  }
}
