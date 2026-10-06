import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'
import { contractEndFor } from '../domain/contracts'

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
    if (!player) return null
    const ovr = Math.max(40, Math.min(99, player.attr_pace || 60))
    const age = player.age || 25
    const isAmbitious = player.personality === 'Ambicioso' || player.personality === 'Estrella'

    // Salario semanal base pretendido
    const baseWage = Math.round(150 + Math.pow(ovr / 10, this.BALANCE.wage_expectation_exponent) * 12)
    const expectedWage = Math.round(baseWage * (isAmbitious ? 1.20 : 1.0))
    const minAcceptableWage = Math.round(expectedWage * 0.85)

    // Rol pretendido
    let desiredRole = 'ROTATION'
    if (ovr >= 75) desiredRole = 'KEY_PLAYER'
    else if (ovr >= 65) desiredRole = 'FIRST_TEAM'
    else if (age <= 21 && (player.attr_potential || 70) >= 75) desiredRole = 'PROSPECT'
    else if (ovr < 55) desiredRole = 'BACKUP'

    // Duración pretendida (años)
    let desiredYears = 2
    if (age <= 23) desiredYears = 3
    else if (age >= 31) desiredYears = 1

    // Cláusula sugerida
    const marketVal = player.market_value || (ovr * 1000)
    const suggestedReleaseClause = Math.round(marketVal * this.BALANCE.release_clause_minimum_multiple)

    return {
      expectedWage,
      minAcceptableWage,
      desiredRole,
      desiredYears,
      suggestedReleaseClause,
      isAmbitious
    }
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
   * Presentar propuesta formal de renovación al futbolista
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

    // 1. Obtener club y jugador
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, budget, wage_budget, game_date')
      .eq('id', clubId)
      .single()
    if (clubErr || !club) throw new Error('Club no encontrado.')

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('club_id', clubId)
      .single()
    if (playerErr || !player) throw new Error('El futbolista no pertenece a tu plantilla.')

    // 2. Validar bloqueo por colapso previo
    if (player.negotiation_lockout_week && player.negotiation_lockout_week > currentWeek) {
      const wait = player.negotiation_lockout_week - currentWeek
      throw new Error(`ERR_NEGOTIATION_LOCKED: El jugador y su representante aún rechazan negociar. Debes esperar ${wait} semana(s) para reabrir conversaciones.`)
    }

    // 3. Validar prima de firma contra tesorería
    if (signingBonus > 0 && (club.budget || 0) < signingBonus) {
      throw new Error(`ERR_INSUFFICIENT_FUNDS_FOR_BONUS: No dispones de fondos suficientes ($${Number(club.budget).toLocaleString()}) para cubrir la prima de firma solicitada ($${signingBonus.toLocaleString()}).`)
    }

    // 4. Evaluar pretensiones del jugador
    const demands = this.calculatePlayerDemands(player)
    
    // Obtener draft existente o crear uno nuevo
    const { data: existingDraft } = await supabase
      .from('contract_negotiations')
      .select('*')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .eq('negotiation_status', 'OPEN')
      .maybeSingle()

    const currentRound = existingDraft ? existingDraft.rounds_completed + 1 : 1

    // Cálculo de satisfacción del jugador (0 a 100+)
    let score = 0
    // Proporción salarial (hasta 70 pts)
    const wageRatio = wageOffered / demands.minAcceptableWage
    score += Math.min(75, wageRatio * 65)

    // Años ofrecidos (hasta 15 pts)
    if (yearsOffered === demands.desiredYears) score += 15
    else if (Math.abs(yearsOffered - demands.desiredYears) === 1) score += 8

    // Rol ofrecido (hasta 10 pts)
    const roleValues = { KEY_PLAYER: 4, FIRST_TEAM: 3, ROTATION: 2, PROSPECT: 2, BACKUP: 1 }
    const offeredRoleVal = roleValues[squadRole] || 2
    const desiredRoleVal = roleValues[demands.desiredRole] || 2
    if (offeredRoleVal >= desiredRoleVal) score += 10
    else score -= 15 // Penalización por ofrecer rol inferior

    // Prima de firma compensatoria (hasta 10 pts)
    if (signingBonus >= (wageOffered * 4)) score += 10
    else if (signingBonus > 0) score += 5

    // ACEPTADO si score >= 75
    if (score >= 75) {
      // 1. Guardar o actualizar en contracts
      // El vencimiento se ancla al calendario del juego (30 de junio), no al reloj real
      const contractEnd = contractEndFor(club.game_date || '2026-07-01', yearsOffered)

      await supabase
        .from('contracts')
        .upsert({
          player_id: playerId,
          club_id: clubId,
          wage_weekly: wageOffered,
          contract_years_total: yearsOffered,
          release_clause: releaseClause || demands.suggestedReleaseClause,
          squad_role: squadRole,
          expires_at: contractEnd,
          status: 'ACTIVE',
          updated_at: new Date().toISOString()
        }, { onConflict: 'player_id' })

      // 2. Actualizar jugador
      const newMorale = Math.min(100, (player.morale || 70) + 15)
      await supabase
        .from('players')
        .update({
          contract_salary: wageOffered,
          contract_wage: wageOffered,
          contract_years: yearsOffered,
          contract_end: contractEnd,
          contract_role: squadRole,
          release_clause: releaseClause || demands.suggestedReleaseClause,
          morale: newMorale,
          morale_unhappy_transfer_blocked: false,
          negotiation_lockout_week: null
        })
        .eq('id', playerId)

      // 3. Descontar prima de firma si aplica
      if (signingBonus > 0) {
        await supabase
          .from('clubs')
          .update({ budget: Math.max(0, (club.budget || 0) - signingBonus) })
          .eq('id', clubId)
      }

      // 4. Cerrar borrador de negociación
      if (existingDraft) {
        await supabase
          .from('contract_negotiations')
          .update({ negotiation_status: 'ACCEPTED' })
          .eq('id', existingDraft.id)
      }

      // 5. Auditoría
      try {
        await supabase.from('contracts_audit_log').insert({
          player_id: playerId,
          club_id: clubId,
          action: 'CONTRACT_RENEWED',
          previous_wage: player.contract_salary,
          new_wage: wageOffered,
          new_expiry: contractEnd
        })
      } catch {
        // Ignorar si tabla no lista
      }

      if (managerId) {
        await auditApi.logAction({
          whoId: managerId,
          action: 'RENEW_CONTRACT',
          entityType: 'player',
          entityId: playerId,
          stateBefore: { salary: player.contract_salary, role: player.contract_role },
          stateAfter: { salary: wageOffered, role: squadRole, years: yearsOffered }
        })
      }

      queryCache.invalidate('squad:')
      queryCache.invalidate('club:')
      queryCache.invalidate('finances:')

      return {
        status: 'ACCEPTED',
        message: `¡Acuerdo sellado! ${player.first_name} ${player.last_name} renovó su contrato por ${yearsOffered} año(s) a $${wageOffered.toLocaleString()}/sem.`
      }
    }

    // RECHAZADO: Evaluar si se alcanzó el límite de 3 rondas
    if (currentRound >= this.BALANCE.max_negotiation_rounds) {
      const lockoutWeek = (currentWeek || 1) + this.BALANCE.lockout_duration_on_collapse_weeks
      
      // Aplicar bloqueo de 4 semanas
      await supabase
        .from('players')
        .update({
          negotiation_lockout_week: lockoutWeek,
          morale: Math.max(15, (player.morale || 70) - 12)
        })
        .eq('id', playerId)

      if (existingDraft) {
        await supabase
          .from('contract_negotiations')
          .update({
            negotiation_status: 'COLLAPSED',
            rounds_completed: currentRound,
            lockout_until_week: lockoutWeek
          })
          .eq('id', existingDraft.id)
      } else {
        await supabase
          .from('contract_negotiations')
          .insert({
            club_id: clubId,
            player_id: playerId,
            wage_offered: wageOffered,
            years_offered: yearsOffered,
            squad_role_offered: squadRole,
            rounds_completed: currentRound,
            negotiation_status: 'COLLAPSED',
            lockout_until_week: lockoutWeek
          })
      }

      queryCache.invalidate('squad:')
      return {
        status: 'COLLAPSED',
        message: `Las negociaciones se han roto tras 3 propuestas insatisfactorias. El representante se retira de la mesa por 4 semanas.`
      }
    } else {
      // Registrar ronda incompleta
      if (existingDraft) {
        await supabase
          .from('contract_negotiations')
          .update({
            wage_offered: wageOffered,
            rounds_completed: currentRound
          })
          .eq('id', existingDraft.id)
      } else {
        await supabase
          .from('contract_negotiations')
          .insert({
            club_id: clubId,
            player_id: playerId,
            wage_offered: wageOffered,
            years_offered: yearsOffered,
            squad_role_offered: squadRole,
            rounds_completed: currentRound,
            negotiation_status: 'OPEN'
          })
      }

      return {
        status: 'REJECTED',
        roundsCompleted: currentRound,
        message: `Propuesta insuficiente (Ronda ${currentRound}/${this.BALANCE.max_negotiation_rounds}). El jugador exige al menos $${demands.minAcceptableWage.toLocaleString()}/sem con rol ${demands.desiredRole}.`,
        counterDemand: demands
      }
    }
  },

  /**
   * Renovar contrato directo (versión rápida)
   */
  async renewContract(playerId, newTerms) {
    const { data, error } = await supabase
      .from('players')
      .update({
        ...newTerms,
        morale_unhappy_transfer_blocked: false,
        negotiation_lockout_week: null
      })
      .eq('id', playerId)
      .select()
      .single()
      
    if (error) throw new Error(error.message)
    queryCache.invalidate('squad:')
    queryCache.invalidate('offers:')
    queryCache.invalidate('club:')
    return data
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
   * Calcular coste de rescisión unilateral (finiquito)
   */
  calculateSeveranceCost(player) {
    if (!player) return 0
    const weeklyWage = player.contract_salary || 500
    const weeksRemaining = player.contract_end_week || 26
    return Math.round(weeksRemaining * weeklyWage * this.BALANCE.severance_cost_factor)
  },

  /**
   * Rescisión unilateral de contrato con indemnización
   */
  async terminateContract(clubId, playerId, { managerId, careerId } = {}) {
    if (!clubId || !playerId) throw new Error('Parámetros de rescisión incompletos.')

    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, budget')
      .eq('id', clubId)
      .single()
    if (clubErr || !club) throw new Error('Club no encontrado.')

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .eq('club_id', clubId)
      .single()
    if (playerErr || !player) throw new Error('El futbolista no pertenece a este club o ya fue dado de baja.')

    const severance = this.calculateSeveranceCost(player)

    if (club.budget < severance) {
      throw new Error(`ERR_INSUFFICIENT_FUNDS_FOR_SEVERANCE: Saldo insuficiente en caja ($${Number(club.budget).toLocaleString()}) para abonar la indemnización de finiquito ($${severance.toLocaleString()}).`)
    }

    const newBudget = Math.max(0, club.budget - severance)
    await supabase.from('clubs').update({ budget: newBudget }).eq('id', clubId)

    await supabase
      .from('players')
      .update({
        club_id: null,
        is_transfer_listed: false,
        transfer_status: 'NOT_FOR_SALE',
        asking_price: null
      })
      .eq('id', playerId)

    try {
      await supabase.from('contract_terminations_log').insert({
        career_id: careerId || null,
        club_id: clubId,
        player_id: playerId,
        termination_type: 'UNILATERAL_BUYOUT',
        severance_paid: severance
      })
    } catch {
      // Ignorar si la tabla no existe en alguna instancia local
    }

    if (managerId) {
      await auditApi.logAction({
        whoId: managerId,
        action: 'TERMINATE_CONTRACT',
        entityType: 'player',
        entityId: playerId,
        stateBefore: { club_id: clubId, budget: club.budget },
        stateAfter: { club_id: null, budget: newBudget, severance }
      })
    }

    queryCache.invalidate('squad:')
    queryCache.invalidate('club:')
    queryCache.invalidate('finances:')
    queryCache.invalidate('offers:')

    return {
      success: true,
      severancePaid: severance,
      remainingBudget: newBudget
    }
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
      await climateApi.applySquadConsequence({
        clubId,
        source: 'SALE',
        gameDate: data.game_date,
        effects: saleConsequences({ isIdol: Boolean(sold?.is_idol), isCaptain: locker?.captain_player_id === data.player_id }, climateApi.difficulty)
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
