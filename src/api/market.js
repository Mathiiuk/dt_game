import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { valueOfPlayer, askingPrice } from '../domain/valuation'
import { freeAgentSpecs, freeAgentsNeeded } from '../domain/marketPool'

export const marketApi = {
  /**
   * Algoritmo de valuación de mercado autoritativo por OVR, edad y categoría.
   */
  calculateMarketValue(player) {
    return valueOfPlayer(player)
  },

  /**
   * Estado de la ventana reglamentaria de pases.
   */
  getMarketStatus(dateString) {
    // El mes sale del texto de la fecha: new Date('2026-07-01') es medianoche UTC y en Argentina cae el 30 de junio
    const month = Number(String(dateString || '2026-08-01').slice(5, 7)) // 1 a 12

    // Verano: Julio (7) y Agosto (8) | Invierno: Enero (1) y Febrero (2)
    const isSummer = month === 7 || month === 8
    const isWinter = month === 1 || month === 2
    const isOpen = isSummer || isWinter

    let windowName = 'Mercado Cerrado'
    if (isSummer) windowName = 'Libro de Pases de Verano (Abierto)'
    else if (isWinter) windowName = 'Libro de Pases de Invierno (Abierto)'

    return {
      isOpen,
      windowName,
      seasonPhase: isSummer ? 'SUMMER_WINDOW' : isWinter ? 'WINTER_WINDOW' : 'REGULAR_SEASON'
    }
  },

  /** Ids de los demás clubes de la competición del club dado (vacío si todavía no tiene liga) */
  async getLeagueClubIds(clubId) {
    if (!clubId) return []
    const { data: mine } = await supabase.from('standings').select('competition_id').eq('club_id', clubId).limit(1).maybeSingle()
    if (!mine?.competition_id) return []
    const { data: rows } = await supabase.from('standings').select('club_id').eq('competition_id', mine.competition_id)
    return (rows || []).map(r => r.club_id).filter(id => id && id !== clubId)
  },

  /**
   * Repone los agentes libres del mercado. Los clubes rivales no tienen plantel propio: el mercado vive de los jugadores sin club
   * (los que se rescinden y un grupo que se repone cuando quedan pocos).
   */
  async ensureFreeAgentPool(gameDate) {
    try {
      const { count } = await supabase.from('players').select('id', { count: 'exact', head: true }).is('club_id', null).eq('is_retired', false)
      const need = freeAgentsNeeded(count || 0)
      if (!need) return 0
      const { buildFreeAgentRows } = await import('./player')
      const { error } = await supabase.from('players').insert(buildFreeAgentRows(freeAgentSpecs(need), gameDate))
      if (error) throw new Error(error.message)
      return need
    } catch (e) {
      console.warn('Aviso: no se pudo reponer el mercado de agentes libres:', e)
      return 0
    }
  },

  /**
   * Obtiene la nómina de futbolistas en el mercado con datos de ojeo.
   */
  async getMarketPlayers(currentClubId, filters = {}) {
    try {
      if (filters.gameDate) await this.ensureFreeAgentPool(filters.gameDate)
      let query = supabase
        .from('players')
        .select('*, clubs(name, short_name, primary_color, reputation)')
        .eq('is_retired', false)

      // El mercado sólo muestra a los clubes de la liga del usuario y a los agentes libres (no a otras carreras)
      const leagueClubIds = await this.getLeagueClubIds(currentClubId)
      query = leagueClubIds.length > 0
        ? query.or(`club_id.in.(${leagueClubIds.join(',')}),club_id.is.null`)
        : query.is('club_id', null)

      if (filters.position) {
        query = query.eq('position', filters.position)
      }

      const { data: players, error } = await query.limit(40)

      if (error) {
        console.warn('Error leyendo players del mercado:', error)
        return []
      }

      if (!players || players.length === 0) return []

      // Obtener reportes de scouting para este club
      const { data: reports } = await supabase
        .from('scout_reports')
        .select('player_id, level')
        .eq('club_id', currentClubId)

      const reportMap = new Map((reports || []).map(r => [r.player_id, r.level]))

      return players.map(p => {
        const marketValue = p.market_value || this.calculateMarketValue(p)
        return {
          ...p,
          market_value: marketValue,
          // Lo que pide el club (o el agente) por el jugador: el servidor acepta desde el 85% de este precio
          asking_price: askingPrice(marketValue, p.clubs?.reputation, !p.club_id),
          scout_level: reportMap.get(p.id) || 0
        }
      })
    } catch (e) {
      console.warn('Error cargando el mercado:', e)
      return []
    }
  },

  /**
   * Ojea a un futbolista revelando sus atributos y potencial con costo proporcionado Tier 5 ($1,000).
   * Soluciona el error del bug de scout anterior usando maybeSingle de forma segura.
   */
  async scoutPlayer(clubId, playerId, cost = 1000) {
    if (!clubId || !playerId) throw new Error('Datos requeridos incompletos para ojear')

    // 1. Verificar fondos del club
    const { data: club, error: cErr } = await supabase
      .from('clubs')
      .select('budget')
      .eq('id', clubId)
      .single()

    if (cErr || !club) throw new Error('No se pudo verificar el presupuesto del club')
    if (club.budget < cost) throw new Error(`Presupuesto insuficiente: ojear cuesta $${cost.toLocaleString()} y dispones de $${(club.budget || 0).toLocaleString()}`)

    // 2. Descontar costo del informe
    await supabase
      .from('clubs')
      .update({ budget: club.budget - cost })
      .eq('id', clubId)

    // 3. Registrar o actualizar scout_reports con maybeSingle (evita PGRST116)
    try {
      const { data: existing } = await supabase
        .from('scout_reports')
        .select('*')
        .eq('club_id', clubId)
        .eq('player_id', playerId)
        .maybeSingle()

      if (existing) {
        if (existing.level >= 2) throw new Error('Este futbolista ya ha sido ojeado al máximo nivel.')
        await supabase
          .from('scout_reports')
          .update({ level: existing.level + 1 })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('scout_reports')
          .insert({ club_id: clubId, player_id: playerId, level: 1 })
      }
    } catch (e) {
      console.warn('Aviso al guardar scout_report en base de datos:', e)
    }

    queryCache.invalidate(`club:${clubId}`)
    return true
  },

  /**
   * Negocia el fichaje con el club vendedor. La base (`negotiate_transfer`) responde ACEPTA, CONTRAOFERTA o RECHAZA; hasta dos
   * rondas, y si acepta ejecuta el fichaje en la misma transacción (de contado o en 3 cuotas: 40% hoy y dos cuotas semanales, +8%).
   * El navegador solo propone un monto: el precio mínimo y las rondas las decide el servidor.
   */
  async negotiate(buyerClubId, playerId, offerAmount, installments = 1, managerId = null) {
    const { auditApi } = await import('./audit')

    const { data, error } = await supabase.rpc('negotiate_transfer', {
      p_player_id: playerId, p_buyer_club_id: buyerClubId, p_offer: offerAmount, p_installments: installments
    })
    if (error) throw new Error(error.message)
    if (data.status !== 'ACCEPTED') return data

    // Consecuencias del fichaje: pagar de más o dejar la caja sin aire molesta a la dirigencia
    try {
      const { financesApi } = await import('./finances')
      const { climateApi } = await import('./climate')
      const { purchaseConsequences } = await import('../domain/squadConsequences')
      // La plantilla cambió: se vuelve a leer la masa salarial con el sueldo del fichaje
      queryCache.invalidate(`finances:${buyerClubId}`)
      const finances = await financesApi.getFinances(buyerClubId)
      await climateApi.applySquadConsequence({
        clubId: buyerClubId,
        source: 'PURCHASE',
        gameDate: data.game_date,
        effects: purchaseConsequences({
          fee: data.price,
          marketValue: data.asking,
          balance: Number(data.buyer_budget_before),
          weeklyExpenses: finances?.expenses?.total || 0,
          installments: data.installments,
          // El club ya tiene al jugador con su sueldo nuevo: si la masa salarial se pasó del presupuesto, la dirigencia lo nota
          wageOverBudget: Boolean(finances?.wageOverBudget)
        }, climateApi.difficulty)
      })
    } catch (climateErr) {
      console.warn('Aviso: no se pudieron aplicar las consecuencias del fichaje:', climateErr)
    }

    if (managerId) {
      try {
        await auditApi.logAction({
          whoId: managerId,
          action: 'BUY_PLAYER',
          entityType: 'player',
          entityId: playerId,
          stateBefore: { budget: Number(data.buyer_budget_before) },
          stateAfter: { budget: Number(data.buyer_budget_after), amount: data.price, installments: data.installments, commission: data.commission }
        })
      } catch (e) { console.warn('Aviso: no se pudo auditar el fichaje:', e) }
    }

    queryCache.invalidate(`squad:${buyerClubId}`)
    queryCache.invalidate(`club:${buyerClubId}`)
    return data
  },

  /**
   * Cuotas de fichajes que vencen con la fecha del juego: la base las cobra y acredita al vendedor. Si la caja no alcanza, la cuota se
   * atrasa con 10% de recargo y la dirigencia lo anota. Se llama una vez por semana.
   */
  async settleInstallments({ clubId, gameDate }) {
    const { data, error } = await supabase.rpc('settle_installments', { p_club_id: clubId, p_game_date: String(gameDate) })
    if (error) {
      console.warn('Aviso: no se pudieron liquidar las cuotas de fichajes:', error.message)
      return null
    }
    if (data?.late > 0) {
      try {
        const { climateApi } = await import('./climate')
        await climateApi.applySquadConsequence({
          clubId,
          source: 'PURCHASE',
          gameDate,
          effects: { board: -2 * data.late, notes: [`Te atrasaste con ${data.late === 1 ? 'una cuota' : `${data.late} cuotas`} de un fichaje: recargo del 10% y la dirigencia lo anotó.`] }
        })
      } catch (e) { console.warn('Aviso: no se pudo registrar el atraso de la cuota:', e) }
    }
    if (data?.paid > 0 || data?.late > 0) {
      queryCache.invalidate(`club:${clubId}`)
      queryCache.invalidate('finances:')
    }
    return data
  }
}
