import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

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
      // 1. Obtener club
      const { data: club, error: cErr } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single()
      if (cErr) throw new Error(cErr.message)

      // 2. Jugadores y sueldos
      const { data: players } = await supabase
        .from('players')
        .select('contract_salary')
        .eq('club_id', clubId)
      const playerWages = players ? players.reduce((sum, p) => sum + (p.contract_salary || 500), 0) : 0

      // 3. Staff y sueldos
      const { data: staff } = await supabase
        .from('staff')
        .select('wage_weekly, salary')
        .eq('club_id', clubId)
      const staffWages = staff ? staff.reduce((sum, s) => sum + (s.wage_weekly || s.salary || 120), 0) : 0

      // 4. Mantenimiento edilicio
      const stadiumMaint = this.BALANCE.stadium_base_maintenance_cost + ((club.stadium_level || 1) * 60)
      const academyMaint = (club.academy_level || 1) * 100
      const totalExpenses = playerWages + staffWages + stadiumMaint + academyMaint

      // 5. Ingresos recurrentes semanales
      const membersCount = club.members_count || this.BALANCE.base_members_count_tier_5
      const membersIncome = Math.round(membersCount * this.BALANCE.member_weekly_due)
      const sponsorsIncome = this.BALANCE.sponsor_base_weekly_tier_5 + ((club.reputation || 20) * 10)
      const tvIncome = this.BALANCE.weekly_tv_rights_tier_5
      const storeIncome = (club.store_level || 1) * 350
      
      const totalRecurringIncome = membersIncome + sponsorsIncome + tvIncome + storeIncome

      // 6. Taquilla proyectada si es local
      const ticketPrice = Number(club.ticket_price || 10.00)
      const stadiumCapacity = club.stadium_capacity || 1000
      const estimatedAttendance = Math.round(stadiumCapacity * 0.65)
      const projectedMatchdayGate = Math.round(estimatedAttendance * ticketPrice)

      const netWeeklyFlow = totalRecurringIncome - totalExpenses
      const balance = Number(club.budget || 0)

      // 7. Estimación de liquidez
      let liquidityWeeks = 'Estable'
      if (balance <= 0) {
        liquidityWeeks = '0 semanas (En números rojos)'
      } else if (netWeeklyFlow < 0) {
        const weeks = (balance / Math.abs(netWeeklyFlow)).toFixed(1)
        liquidityWeeks = `${weeks} semanas`
      } else {
        liquidityWeeks = 'Superavitario (> 52 semanas)'
      }

      // 8. Estado de salud financiera
      let healthStatus = 'HEALTHY'
      if (balance < 0) healthStatus = 'CRITICAL'
      else if (balance < 5000 || netWeeklyFlow < -2000) healthStatus = 'CAUTION'

      return {
        balance,
        debt: club.debt || 0,
        ticketPrice,
        wageBudgetWeekly: club.wage_budget || 5000,
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
        monthlyProfit: netWeeklyFlow * 4
      }
    }, 20000)
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
  async recordTransaction(clubId, careerId, category, amount, description, seasonYear = 1, weekNumber = 1) {
    if (!clubId) return

    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    const currentBalance = Number(club?.budget || 0)
    const newBalance = currentBalance + Number(amount)

    // Actualizar caja del club
    await supabase.from('clubs').update({ budget: newBalance }).eq('id', clubId)

    // Insertar en libro mayor
    try {
      await supabase.from('financial_transactions_ledger').insert({
        career_id: careerId || null,
        club_id: clubId,
        season_year: seasonYear,
        week_number: weekNumber,
        category,
        amount,
        balance_after: newBalance,
        description
      })
    } catch {
      // Ignorar si tabla no lista
    }

    queryCache.invalidate(`finances:${clubId}`)
    queryCache.invalidate(`club:${clubId}`)
  },
  
  /**
   * Mejorar nivel de instalación edilicia
   */
  async upgradeFacility(clubId, facilityType, cost, currentLevel) {
    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    if (!club || club.budget < cost) throw new Error('Presupuesto insuficiente')
    
    const updates = { budget: club.budget - cost }
    updates[facilityType] = currentLevel + 1
    
    const { error } = await supabase.from('clubs').update(updates).eq('id', clubId)
    if (error) throw new Error(error.message)

    queryCache.invalidate('finances:')
    queryCache.invalidate('club:')
  }
}
