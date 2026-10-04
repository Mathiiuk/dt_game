import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'

export const contractApi = {
  // Configuración y parámetros de balance (Reglas 14.1 - 14.4)
  BALANCE: {
    transfer_budget_reinvestment_ratio: 0.80, // 80% al presupuesto de fichajes
    severance_cost_factor: 0.65,              // 65% de salarios pendientes
    offer_validity_weeks: 2,                  // Validez de ofertas entrantes
    ai_counter_tolerance_threshold: 1.25,      // Tolerancia máxima de regateo IA
  },

  /**
   * Renovar contrato de un futbolista
   */
  async renewContract(playerId, newTerms) {
    const { data, error } = await supabase
      .from('players')
      .update({
        ...newTerms,
        morale_unhappy_transfer_blocked: false // Renovar calma al jugador
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

      // Enriquecer con nombres de clubes compradores si no vienen en relación
      const offersWithClubs = await Promise.all(
        (data || []).map(async (offer) => {
          let fromClubName = 'Club Interesado'
          if (offer.from_club_id) {
            const { data: clubData } = await supabase
              .from('clubs')
              .select('name, tier')
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
    // Si no tiene semana de fin, asumimos 26 semanas promedio (medio año)
    const weeksRemaining = player.contract_end_week || 26
    return Math.round(weeksRemaining * weeklyWage * this.BALANCE.severance_cost_factor)
  },

  /**
   * Rescisión unilateral de contrato con indemnización
   */
  async terminateContract(clubId, playerId, { managerId, careerId } = {}) {
    if (!clubId || !playerId) throw new Error('Parámetros de rescisión incompletos.')

    // 1. Obtener club y jugador
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

    // 2. Calcular finiquito
    const severance = this.calculateSeveranceCost(player)

    // 3. Validar fondos suficientes
    if (club.budget < severance) {
      throw new Error(`ERR_INSUFFICIENT_FUNDS_FOR_SEVERANCE: Saldo insuficiente en caja ($${Number(club.budget).toLocaleString()}) para abonar la indemnización de finiquito ($${severance.toLocaleString()}).`)
    }

    // 4. Descontar finiquito
    const newBudget = Math.max(0, club.budget - severance)
    await supabase.from('clubs').update({ budget: newBudget }).eq('id', clubId)

    // 5. Liberar futbolista (agente libre)
    await supabase
      .from('players')
      .update({
        club_id: null,
        is_transfer_listed: false,
        transfer_status: 'NOT_FOR_SALE',
        asking_price: null
      })
      .eq('id', playerId)

    // 6. Registrar en auditoría de rescisiones
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

    // 7. Audit log general
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
   * Resolver oferta entrante: Aceptar, Rechazar o Contraofertar
   */
  async resolveOffer(offerId, status, playerId, fromClubId, toClubId, offerAmount, managerId, extra = {}) {
    // 1. Obtener oferta actual para verificar estado
    const { data: offer, error: fetchErr } = await supabase
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .single()

    if (fetchErr || !offer) throw new Error('Oferta no encontrada.')
    if (offer.status === 'ACCEPTED' || offer.status === 'REJECTED') {
      throw new Error('La oferta ya fue resuelta anteriormente (operación idempotente).')
    }

    const effectivePlayerId = playerId || offer.player_id
    const effectiveToClubId = toClubId || offer.to_club_id
    const effectiveFromClubId = fromClubId || offer.from_club_id
    const effectiveAmount = offerAmount || offer.amount

    // CASO: CONTRAOFERTA (COUNTER)
    if (status === 'COUNTER') {
      const counterAmount = extra.counterAmount || Math.round(effectiveAmount * 1.15)
      const maxTolerance = effectiveAmount * this.BALANCE.ai_counter_tolerance_threshold

      // Evaluar respuesta de la IA
      if (counterAmount <= maxTolerance) {
        // La IA acepta la contraoferta
        await supabase
          .from('offers')
          .update({
            amount: counterAmount,
            counter_amount: counterAmount,
            status: 'ACCEPTED'
          })
          .eq('id', offerId)

        // Ejecutar venta con el monto de la contraoferta
        return await this.executeSaleTransfer({
          offerId,
          playerId: effectivePlayerId,
          toClubId: effectiveToClubId,
          fromClubId: effectiveFromClubId,
          finalAmount: counterAmount,
          managerId
        })
      } else {
        // La IA rechaza la contraoferta por considerarla desmedida
        await supabase
          .from('offers')
          .update({
            status: 'REJECTED',
            counter_amount: counterAmount
          })
          .eq('id', offerId)

        queryCache.invalidate('offers:')
        return {
          status: 'REJECTED',
          message: 'El club comprador ha rechazado la contraoferta por considerarla fuera de su presupuesto y se retiró de las negociaciones.'
        }
      }
    }

    // CASO: RECHAZAR (REJECTED)
    if (status === 'REJECTED') {
      await supabase
        .from('offers')
        .update({ status: 'REJECTED' })
        .eq('id', offerId)

      // Impacto en la moral del jugador si era una gran oferta
      const { data: player } = await supabase
        .from('players')
        .select('market_value, personality, morale')
        .eq('id', effectivePlayerId)
        .maybeSingle()

      if (player && effectiveAmount >= (player.market_value * 1.2)) {
        const isAmbitious = player.personality === 'Ambicioso' || player.personality === 'Estrella'
        const penalty = isAmbitious ? 25 : 15
        const newMorale = Math.max(10, (player.morale ?? 70) - penalty)
        
        await supabase
          .from('players')
          .update({
            morale: newMorale,
            morale_unhappy_transfer_blocked: true
          })
          .eq('id', effectivePlayerId)
      }

      queryCache.invalidate('offers:')
      queryCache.invalidate('squad:')
      return { status: 'REJECTED' }
    }

    // CASO: ACEPTAR (ACCEPTED)
    if (status === 'ACCEPTED') {
      await supabase
        .from('offers')
        .update({ status: 'ACCEPTED' })
        .eq('id', offerId)

      return await this.executeSaleTransfer({
        offerId,
        playerId: effectivePlayerId,
        toClubId: effectiveToClubId,
        fromClubId: effectiveFromClubId,
        finalAmount: effectiveAmount,
        managerId
      })
    }
  },

  /**
   * Ejecutar traspaso físico y liquidación financiera
   */
  async executeSaleTransfer({ offerId, playerId, toClubId, fromClubId, finalAmount, managerId }) {
    // 1. Obtener club vendedor
    const { data: toClub } = await supabase
      .from('clubs')
      .select('budget, name')
      .eq('id', toClubId)
      .single()

    // 2. Reparto de venta: 80% a presupuesto de fichajes (Regla 14.1)
    const reinvestment = Math.round(finalAmount * this.BALANCE.transfer_budget_reinvestment_ratio)
    const newBudget = (toClub?.budget || 0) + reinvestment

    // Sumar dinero al club vendedor
    await supabase.from('clubs').update({ budget: newBudget }).eq('id', toClubId)
    
    // Restar al club comprador si es un club real/bot registrado
    if (fromClubId) {
      const { data: fromClub } = await supabase.from('clubs').select('budget').eq('id', fromClubId).maybeSingle()
      if (fromClub) {
        await supabase
          .from('clubs')
          .update({ budget: Math.max(0, (fromClub.budget || 0) - finalAmount) })
          .eq('id', fromClubId)
      }
    }

    // 3. Mover jugador y resetear transferibilidad
    await supabase
      .from('players')
      .update({
        club_id: fromClubId,
        is_transfer_listed: false,
        transfer_status: 'NOT_FOR_SALE',
        asking_price: null,
        morale_unhappy_transfer_blocked: false
      })
      .eq('id', playerId)

    // 4. Auditoría de traspasos
    try {
      await supabase.from('transfer_audit_log').insert({
        player_id: playerId,
        from_club_id: toClubId,
        to_club_id: fromClubId,
        transfer_fee: finalAmount,
        wage_weekly: 0,
        season_year: 1
      })
    } catch {
      // Ignorar si tabla no disponible
    }

    if (managerId) {
      await auditApi.logAction({
        whoId: managerId,
        action: 'SELL_PLAYER',
        entityType: 'player',
        entityId: playerId,
        stateBefore: { club_id: toClubId, budget: toClub?.budget },
        stateAfter: { club_id: fromClubId, budget: newBudget, amount: finalAmount, reinvestment }
      })
    }

    queryCache.invalidate('squad:')
    queryCache.invalidate('offers:')
    queryCache.invalidate('finances:')
    queryCache.invalidate('club:')
    queryCache.invalidate('market:')

    return {
      status: 'ACCEPTED',
      amount: finalAmount,
      reinvestment,
      newBudget
    }
  },

  /**
   * Generar ofertas de compra de clubes de IA durante el avance semanal
   */
  async generateRandomOffersForWeek(clubId, players, isMarketOpen, currentWeek = 1) {
    if (!players || players.length === 0 || !isMarketOpen) return
    
    // Obtener clubes de IA para simular interés
    const { data: bots } = await supabase
      .from('clubs')
      .select('id, name, budget, tier')
      .neq('id', clubId)
      .limit(15)

    if (!bots || bots.length === 0) return

    for (const player of players) {
      // Si está en lista de transferibles: 35% chance; si no: 3% chance
      const isListed = player.is_transfer_listed || player.transfer_status === 'TRANSFER_LISTED'
      const chance = isListed ? 0.35 : 0.03
      
      if (Math.random() < chance) {
        const buyer = bots[Math.floor(Math.random() * bots.length)]
        const baseValue = player.market_value || (player.attr_pace ? player.attr_pace * 1000 : 15000)
        
        // Si el DT fijó asking_price, la IA oferta cerca de ese valor
        let offerAmount
        if (isListed && player.asking_price && player.asking_price > 0) {
          const factor = 0.85 + (Math.random() * 0.25) // 85% a 110% de lo pedido
          offerAmount = Math.round(player.asking_price * factor)
        } else {
          const factor = 0.80 + (Math.random() * 0.40) // 80% a 120% del valor de mercado
          offerAmount = Math.round(baseValue * factor)
        }
        
        // Asegurar que el club comprador tiene presupuesto mínimo
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
