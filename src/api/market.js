import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { valueOfPlayer, askingPrice } from '../domain/valuation'

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
    const d = new Date(dateString || '2026-08-01')
    const month = d.getMonth() + 1 // 1 a 12

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
   * Obtiene la nómina de futbolistas en el mercado con datos de ojeo.
   */
  async getMarketPlayers(currentClubId, filters = {}) {
    try {
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
   * Compra o ficha a un futbolista. La operación la resuelve la base (`execute_transfer`) en una sola transacción: valida la
   * ventana de pases, el precio que pide el club vendedor y la caja, y mueve la plata y el jugador. El navegador solo propone el monto.
   */
  async buyPlayer(buyerClubId, playerId, offerAmount, managerId) {
    const { auditApi } = await import('./audit')

    const { data, error } = await supabase.rpc('execute_transfer', { p_player_id: playerId, p_buyer_club_id: buyerClubId, p_offer: offerAmount })
    if (error) throw new Error(error.message)

    // Consecuencias del fichaje: pagar de más o dejar la caja sin aire molesta a la dirigencia
    try {
      const { financesApi } = await import('./finances')
      const { climateApi } = await import('./climate')
      const { purchaseConsequences } = await import('../domain/squadConsequences')
      const finances = await financesApi.getFinances(buyerClubId)
      await climateApi.applySquadConsequence({
        clubId: buyerClubId,
        source: 'PURCHASE',
        gameDate: data.game_date,
        effects: purchaseConsequences({ fee: offerAmount, marketValue: data.asking, balance: Number(data.buyer_budget_before), weeklyExpenses: finances?.expenses?.total || 0 }, climateApi.difficulty)
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
          stateAfter: { budget: Number(data.buyer_budget_after), amount: offerAmount }
        })
      } catch (e) { console.warn('Aviso: no se pudo auditar el fichaje:', e) }
    }

    queryCache.invalidate(`squad:${buyerClubId}`)
    queryCache.invalidate(`club:${buyerClubId}`)
    return data
  }
}
