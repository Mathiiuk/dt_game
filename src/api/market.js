import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const marketApi = {
  /**
   * Algoritmo de valuación de mercado autoritativo por OVR, edad y categoría.
   */
  calculateMarketValue(player, tier = 5) {
    const base = tier === 5 ? 2500 : 10000
    const pace = player.attr_pace || 50
    const shooting = player.attr_shooting || 50
    const passing = player.attr_passing || 50
    const defending = player.attr_defending || 50
    const ovr = player.attr_overall || Math.round((pace + shooting + passing + defending) / 4)

    const ovrFactor = Math.pow(Math.max(30, ovr) / 50, 2.5)
    const age = player.age || 22
    const ageFactor = age < 21 ? 1.65 : (age > 32 ? 0.35 : (age > 28 ? 0.75 : 1.0))

    return Math.round(base * ovrFactor * ageFactor)
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
        .select('*, clubs(name, short_name, primary_color)')
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
        return this.generateFallbackMarketPlayers(currentClubId)
      }

      if (!players || players.length === 0) {
        return this.generateFallbackMarketPlayers(currentClubId)
      }

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
          scout_level: reportMap.get(p.id) || 0
        }
      })
    } catch (e) {
      console.warn('Fallback cargando mercado:', e)
      return this.generateFallbackMarketPlayers(currentClubId)
    }
  },

  /**
   * Genera futbolistas de mercado y agentes libres de respaldo para garantizar fluidez.
   */
  generateFallbackMarketPlayers(currentClubId) {
        const names = [
      { f: 'Lucas', l: 'Martínez', pos: 'DC', age: 20, ovr: 58, pot: 76 },
      { f: 'Matías', l: 'Ríos', pos: 'MC', age: 23, ovr: 57, pot: 68 },
      { f: 'Nicolás', l: 'Benítez', pos: 'DFC', age: 28, ovr: 61, pot: 62 },
      { f: 'Fabricio', l: 'Paredes', pos: 'PO', age: 24, ovr: 56, pot: 70 },
      { f: 'Lautaro', l: 'Acosta', pos: 'EI', age: 19, ovr: 57, pot: 78 },
      { f: 'Franco', l: 'Sosa', pos: 'LD', age: 22, ovr: 55, pot: 66 },
      { f: 'Ezequiel', l: 'Fernández', pos: 'MCD', age: 26, ovr: 60, pot: 63 },
      { f: 'Agustín', l: 'Giménez', pos: 'MCO', age: 21, ovr: 57, pot: 74 },
      { f: 'Mauro', l: 'Díaz', pos: 'LI', age: 31, ovr: 59, pot: 59 },
      { f: 'Rodrigo', l: 'Romero', pos: 'ED', age: 20, ovr: 56, pot: 73 }
    ]

    return names.map((n, i) => {
      const p = {
        id: `mkt_player_${i}`,
        first_name: n.f,
        last_name: n.l,
        position: n.pos,
        age: n.age,
        attr_overall: n.ovr,
        attr_potential: n.pot,
        attr_pace: 48 + (i % 15),
        attr_shooting: 45 + (i % 20),
        attr_passing: 47 + (i % 18),
        attr_defending: 46 + (i % 16),
        attr_stamina: 75,
        state_fitness: 90,
        club_id: i % 2 === 0 ? `rival_club_${i}` : null,
        clubs: i % 2 === 0 ? { name: `Atlético Regional ${i + 1}`, short_name: `REG${i+1}` } : null,
        is_free_agent: i % 2 !== 0,
        scout_level: 0
      }
      p.market_value = this.calculateMarketValue(p)
      return p
    })
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
   * Compra o ficha a un futbolista de forma autoritativa y atómica.
   */
  async buyPlayer(buyerClubId, playerId, offerAmount, managerId) {
    const { auditApi } = await import('./audit')

    // 1. Obtener club comprador
    const { data: buyer, error: buyerErr } = await supabase
      .from('clubs')
      .select('budget, game_date')
      .eq('id', buyerClubId)
      .single()

    if (buyerErr || !buyer) throw new Error('No se pudo encontrar al club comprador')

    // 2. Verificar ventana de pases
    const marketStatus = this.getMarketStatus(buyer.game_date)
    if (!marketStatus.isOpen) {
      throw new Error('El libro de pases está cerrado. Solo puedes inscribir fichajes durante las ventanas de Verano o Invierno.')
    }

    if (buyer.budget < offerAmount) {
      throw new Error(`Presupuesto insuficiente: la operación requiere $${offerAmount.toLocaleString()} y tu club tiene $${buyer.budget.toLocaleString()}.`)
    }

    // 3. Obtener jugador y club vendedor si existe
    let sellerClub = null
    let player = null

    try {
      const { data: p } = await supabase
        .from('players')
        .select('*, clubs(*)')
        .eq('id', playerId)
        .maybeSingle()

      player = p
      sellerClub = p?.clubs
    } catch (e) {
      console.warn('Aviso: jugador de mercado virtual:', e)
    }

    const marketValue = player?.market_value || (player ? this.calculateMarketValue(player) : offerAmount)

    // Si tiene club vendedor, evaluar oferta de la IA
    if (sellerClub) {
      const minAcceptable = marketValue * 0.85
      if (offerAmount < minAcceptable) {
        throw new Error(`El ${sellerClub.name} ha rechazado la propuesta de $${offerAmount.toLocaleString()}. Exigen al menos $${Math.round(marketValue).toLocaleString()}.`)
      }
    }

    // 4. Débito de fondos del comprador
    const newBuyerBudget = buyer.budget - offerAmount
    await supabase
      .from('clubs')
      .update({ budget: newBuyerBudget })
      .eq('id', buyerClubId)

    // 5. Crédito al vendedor si aplica
    if (sellerClub && player.club_id) {
      const newSellerBudget = (sellerClub.budget || 0) + offerAmount
      await supabase
        .from('clubs')
        .update({ budget: newSellerBudget })
        .eq('id', player.club_id)
    }

    // 6. Transferir ficha del jugador
    if (player && player.id && !player.id.startsWith('mkt_player_')) {
      await supabase
        .from('players')
        .update({ club_id: buyerClubId })
        .eq('id', playerId)
    } else {
      // Si era un jugador virtual del pool, lo insertamos en la nómina del club
      const fallbackList = this.generateFallbackMarketPlayers(buyerClubId)
      const selected = fallbackList.find(fp => fp.id === playerId)
      if (selected) {
        await supabase.from('players').insert({
          club_id: buyerClubId,
          first_name: selected.first_name,
          last_name: selected.last_name,
          position: selected.position,
          age: selected.age,
          shirt_number: Math.floor(Math.random() * 80) + 21,
          attr_pace: selected.attr_pace,
          attr_shooting: selected.attr_shooting,
          attr_passing: selected.attr_passing,
          attr_defending: selected.attr_defending,
          attr_stamina: 75,
          attr_potential: selected.attr_potential,
          state_fitness: 90,
          state_morale: 80
        })
      }
    }

    // Consecuencias del fichaje: pagar de más o dejar la caja sin aire molesta a la dirigencia
    try {
      const { financesApi } = await import('./finances')
      const { climateApi } = await import('./climate')
      const { purchaseConsequences } = await import('../domain/squadConsequences')
      const finances = await financesApi.getFinances(buyerClubId)
      await climateApi.applySquadConsequence({
        clubId: buyerClubId,
        source: 'PURCHASE',
        gameDate: buyer.game_date,
        effects: purchaseConsequences({ fee: offerAmount, marketValue, balance: buyer.budget, weeklyExpenses: finances?.expenses?.total || 0 }, climateApi.difficulty)
      })
    } catch (climateErr) {
      console.warn('Aviso: no se pudieron aplicar las consecuencias del fichaje:', climateErr)
    }

    // 7. Registro de auditoría
    try {
      await supabase.from('transfer_audit_log').insert({
        player_id: playerId,
        from_club_id: sellerClub?.id || null,
        to_club_id: buyerClubId,
        transfer_fee: offerAmount,
        wage_weekly: 300,
        timestamp: new Date().toISOString()
      })
    } catch (logErr) {
      console.warn('Aviso: no se pudo persistir transfer_audit_log:', logErr)
    }

    if (managerId) {
      try {
        await auditApi.logAction({
          whoId: managerId,
          action: 'BUY_PLAYER',
          entityType: 'player',
          entityId: playerId,
          stateBefore: { budget: buyer.budget },
          stateAfter: { budget: newBuyerBudget, amount: offerAmount }
        })
      } catch (e) {}
    }

    queryCache.invalidate(`squad:${buyerClubId}`)
    queryCache.invalidate(`club:${buyerClubId}`)
    return true
  }
}
