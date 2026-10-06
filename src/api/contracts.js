import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'
import { playerDemands, severanceCost } from '../domain/contractDemands'

export const contractApi = {
  // Configuración y parámetros de balance (Reglas 14.1 - 15.4)
  BALANCE: {
    transfer_budget_reinvestment_ratio: 0.80, // 80% al presupuesto de fichajes
    severance_cost_factor: 0.65,              // 65% de salarios pendientes
    offer_validity_weeks: 2,                  // Validez de ofertas entrantes
    ai_counter_tolerance_threshold: 1.25,      // Tolerancia máxima de regateo IA
    wage_expectation_exponent: 2.1,           // Crecimiento salarial exponencial por OVR
    max_negotiation_rounds: 3,                // Límite de 3 intentos antes de ruptura
    lockout_duration_on_collapse_weeks: 4,    // 4 semanas de bloqueo al colapsar
    release_clause_minimum_multiple: 3.0,     // 3x valor de mercado para cláusula
  },

  /**
   * Calcular pretensiones salariales y contractuales del futbolista
   */
  calculatePlayerDemands(player) {
    return playerDemands(player)
  },

  /**
   * Obtener el estado actual de negociación de un jugador
   */
  async getNegotiationStatus(clubId, playerId, currentWeek = 1) {
    const { data: player, error } = await supabase
      .from('players')
      .select('*, contracts(*)')
      .eq('id', playerId)
      .single()

    if (error || !player) throw new Error('Jugador no encontrado.')

    const demands = this.calculatePlayerDemands(player)
    const isLockedOut = player.negotiation_lockout_week && player.negotiation_lockout_week > currentWeek
    const lockoutWeeksRemaining = isLockedOut ? (player.negotiation_lockout_week - currentWeek) : 0

    // Consultar borrador de negociación activa si existe
    const { data: activeDraft } = await supabase
      .from('contract_negotiations')
      .select('*')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .eq('negotiation_status', 'OPEN')
      .maybeSingle()

    return {
      player,
      demands,
      isLockedOut,
      lockoutWeeksRemaining,
      roundsCompleted: activeDraft ? activeDraft.rounds_completed : 0
    }
  },

  /**
   * Presentar propuesta formal de renovación. La resuelve la base (`negotiate_renewal`) en una sola transacción: calcula las
   * pretensiones, puntúa la propuesta, lleva las rondas (hasta 3; si se rompe, el representante se retira 4 semanas) y, si el jugador
   * acepta, escribe el contrato y descuenta la prima de firma. El navegador solo propone los términos.
   */
  async submitRenewalOffer({
    clubId,
    playerId,
    wageOffered,
    yearsOffered = 1,
    squadRole = 'ROTATION',
    releaseClause = null,
    signingBonus = 0,
    currentWeek = 1,
    managerId = null
  }) {
    if (!clubId || !playerId) throw new Error('Parámetros incompletos.')

    const { data, error } = await supabase.rpc('negotiate_renewal', {
      p_player_id: playerId,
      p_club_id: clubId,
      p_wage: wageOffered,
      p_years: yearsOffered,
      p_role: squadRole,
      p_release_clause: releaseClause,
      p_bonus: signingBonus,
      p_week: currentWeek
    })
    if (error) throw new Error(error.message)

    if (data.status === 'ACCEPTED') {
      if (managerId) {
        try {
          await auditApi.logAction({
            whoId: managerId,
            action: 'RENEW_CONTRACT',
            entityType: 'player',
            entityId: playerId,
            stateBefore: { salary: data.previous_wage },
            stateAfter: { salary: data.wage, role: squadRole, years: data.years, bonus: data.bonus }
          })
        } catch (e) { console.warn('Aviso: no se pudo auditar la renovación:', e) }
      }
      queryCache.invalidate('squad:')
      queryCache.invalidate('club:')
      queryCache.invalidate('finances:')
      return {
        status: 'ACCEPTED',
        message: `¡Acuerdo sellado! El jugador renovó su contrato por ${data.years} año(s) a $${Number(data.wage).toLocaleString()}/sem.`
      }
    }

    queryCache.invalidate('squad:')
    if (data.status === 'COLLAPSED') {
      return {
        status: 'COLLAPSED',
        message: `Las negociaciones se han roto tras ${this.BALANCE.max_negotiation_rounds} propuestas insatisfactorias. El representante se retira de la mesa por ${this.BALANCE.lockout_duration_on_collapse_weeks} semanas.`
      }
    }

    const demands = this.calculatePlayerDemands({ ...(await this._playerForDemands(playerId)) })
    return {
      status: 'REJECTED',
      roundsCompleted: data.round,
      message: `Propuesta insuficiente (Ronda ${data.round}/${this.BALANCE.max_negotiation_rounds}). El jugador exige al menos $${Number(data.demands.min_wage).toLocaleString()}/sem con rol ${data.demands.desired_role}.`,
      counterDemand: demands
    }
  },

  /** Datos del jugador para mostrar sus pretensiones */
  async _playerForDemands(playerId) {
    const { data } = await supabase.from('players').select('attr_overall, age, attr_potential, personality, market_value').eq('id', playerId).maybeSingle()
    return data || {}
  },

  /**
   * Cambiar estado de transferibilidad y precio pedido
   */
  async setTransferStatus(playerId, { transfer_status, asking_price }) {
    const isListed = transfer_status === 'TRANSFER_LISTED'
    const updateData = {
      transfer_status,
      is_transfer_listed: isListed
    }
    if (asking_price !== undefined) {
      updateData.asking_price = Math.max(0, Math.round(asking_price))
    }

    const { data, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    queryCache.invalidate('squad:')
    queryCache.invalidate('market:')
    return data
  },
  
  /**
   * Obtener ofertas recibidas pendientes para un club
   */
  async getOffersForClub(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`offers:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          players:player_id (
            id, first_name, last_name, position, age, 
            market_value, contract_salary, morale, personality
          )
        `)
        .eq('to_club_id', clubId)
        .in('status', ['PENDING', 'COUNTER_OFFERED'])
        .order('created_at', { ascending: false })
        
      if (error) throw new Error(error.message)

      const offersWithClubs = await Promise.all(
        (data || []).map(async (offer) => {
          let fromClubName = 'Club Interesado'
          if (offer.from_club_id) {
            const { data: clubData } = await supabase
              .from('clubs')
              .select('name, league_tier')
              .eq('id', offer.from_club_id)
              .maybeSingle()
            if (clubData) fromClubName = clubData.name
          }
          return {
            ...offer,
            from_club_name: fromClubName
          }
        })
      )

      return offersWithClubs
    }, 15000)
  },

  /**
   * Calcular coste de rescisión unilateral (finiquito): 65% de los sueldos que faltan hasta el vencimiento del contrato
   */
  calculateSeveranceCost(player, gameDate = null) {
    if (!player) return 0
    return severanceCost(player, gameDate)
  },

  /**
   * Rescisión unilateral de contrato con indemnización. La resuelve la base (`terminate_contract`): calcula el finiquito con la fecha
   * de vencimiento, lo descuenta de la caja y deja libre al jugador, todo en una transacción.
   */
  async terminateContract(clubId, playerId, { managerId } = {}) {
    if (!clubId || !playerId) throw new Error('Parámetros de rescisión incompletos.')

    const { data, error } = await supabase.rpc('terminate_contract', { p_club_id: clubId, p_player_id: playerId })
    if (error) throw new Error(error.message)

    if (managerId) {
      try {
        await auditApi.logAction({
          whoId: managerId,
          action: 'TERMINATE_CONTRACT',
          entityType: 'player',
          entityId: playerId,
          stateAfter: { club_id: null, budget: data.new_budget, severance: data.severance }
        })
      } catch (e) { console.warn('Aviso: no se pudo auditar la rescisión:', e) }
    }

    queryCache.invalidate('squad:')
    queryCache.invalidate('club:')
    queryCache.invalidate('finances:')
    queryCache.invalidate('offers:')
    queryCache.invalidate('market:')

    return { success: true, severancePaid: data.severance, remainingBudget: data.new_budget }
  },

  /**
   * Resolver oferta entrante: Aceptar, Rechazar o Contraofertar. La resuelve la base (`resolve_sale_offer`) en una sola transacción:
   * el monto sale de la oferta guardada (no del navegador), valida que sea de tu club y que el jugador siga siendo tuyo,
   * y mueve la plata (80% del precio entra a la caja) y al jugador. Los argumentos de jugador, clubes y monto se mantienen por
   * compatibilidad, pero la base no los usa.
   */
  async resolveOffer(offerId, status, playerId, fromClubId, toClubId, offerAmount, managerId, extra = {}) {
    const { data, error } = await supabase.rpc('resolve_sale_offer', {
      p_offer_id: offerId,
      p_action: status,
      p_counter: status === 'COUNTER' ? (extra.counterAmount ?? null) : null
    })
    if (error) throw new Error(error.message)

    queryCache.invalidate('offers:')
    queryCache.invalidate('squad:')
    if (data.status !== 'ACCEPTED') return data

    const clubId = toClubId
    // Vender al ídolo o al capitán tiene costo en la tribuna y en el vestuario
    try {
      const [{ data: sold }, { data: locker }] = await Promise.all([
        supabase.from('players').select('is_idol').eq('id', data.player_id).maybeSingle(),
        supabase.from('club_locker_room').select('captain_player_id').eq('club_id', clubId).maybeSingle()
      ])
      const { climateApi } = await import('./climate')
      const { saleConsequences } = await import('../domain/squadConsequences')
      const { financesApi } = await import('./finances')
      const finances = await financesApi.getFinances(clubId).catch(() => null)
      await climateApi.applySquadConsequence({
        clubId,
        source: 'SALE',
        gameDate: data.game_date,
        effects: saleConsequences({
          isIdol: Boolean(sold?.is_idol),
          isCaptain: locker?.captain_player_id === data.player_id,
          fee: data.amount,
          // Caja de antes de cobrar la venta: si ya estaba en apuros, vender alivia a la dirigencia
          balance: finances ? Number(data.new_budget) - Number(data.reinvestment) : null,
          weeklyExpenses: finances?.expenses?.total || 0
        }, climateApi.difficulty)
      })
    } catch (climateErr) {
      console.warn('Aviso: no se pudieron aplicar las consecuencias de la venta:', climateErr)
    }

    if (managerId) {
      try {
        await auditApi.logAction({
          whoId: managerId,
          action: 'SELL_PLAYER',
          entityType: 'player',
          entityId: data.player_id,
          stateAfter: { club_id: fromClubId, budget: data.new_budget, amount: data.amount, reinvestment: data.reinvestment }
        })
      } catch (e) { console.warn('Aviso: no se pudo auditar la venta:', e) }
    }

    queryCache.invalidate('finances:')
    queryCache.invalidate('club:')
    queryCache.invalidate('market:')
    return { status: 'ACCEPTED', amount: data.amount, reinvestment: data.reinvestment, newBudget: data.new_budget }
  },

  /**
   * Generar ofertas de compra de clubes de IA durante el avance semanal
   */
  async generateRandomOffersForWeek(clubId, players, isMarketOpen, currentWeek = 1) {
    if (!players || players.length === 0 || !isMarketOpen) return
    
    const { data: bots } = await supabase
      .from('clubs')
      .select('id, name, budget, league_tier')
      .neq('id', clubId)
      .limit(15)

    if (!bots || bots.length === 0) return

    for (const player of players) {
      const isListed = player.is_transfer_listed || player.transfer_status === 'TRANSFER_LISTED'
      const chance = isListed ? 0.35 : 0.03
      
      if (Math.random() < chance) {
        const buyer = bots[Math.floor(Math.random() * bots.length)]
        const baseValue = player.market_value || (player.attr_pace ? player.attr_pace * 1000 : 15000)
        
        let offerAmount
        if (isListed && player.asking_price && player.asking_price > 0) {
          const factor = 0.85 + (Math.random() * 0.25)
          offerAmount = Math.round(player.asking_price * factor)
        } else {
          const factor = 0.80 + (Math.random() * 0.40)
          offerAmount = Math.round(baseValue * factor)
        }
        
        if ((buyer.budget || 50000) >= offerAmount) {
          const newOffer = {
            player_id: player.id,
            from_club_id: buyer.id,
            to_club_id: clubId,
            amount: offerAmount,
            status: 'PENDING',
            expires_at_week: (currentWeek || 1) + 2
          }
          await supabase.from('offers').insert(newOffer)
        }
      }
    }
  }
}
