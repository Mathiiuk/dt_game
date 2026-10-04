import { supabase } from './supabase'
import { auditApi } from './audit'
import { queryCache } from '../utils/cache'

export const REPUTATION_RANKS = {
  LOCAL_UNKNOWN: {
    id: 'LOCAL_UNKNOWN',
    min: 1,
    max: 20,
    title: 'Desconocido de Potrero',
    subtitle: 'DT Barrial',
    perk: 'Conocimiento del barro y talento de potrero aficionado.',
    color: 'zinc',
    stars: 1
  },
  REGIONAL_PROSPECT: {
    id: 'REGIONAL_PROSPECT',
    min: 21,
    max: 40,
    title: 'Promesa del Ascenso',
    subtitle: 'Técnico Regional',
    perk: 'Capacidad de atraer talentos y promesas del ascenso regional.',
    color: 'emerald',
    stars: 2
  },
  ASCENT_SPECIALIST: {
    id: 'ASCENT_SPECIALIST',
    min: 41,
    max: 60,
    title: 'Estratega Consolidado',
    subtitle: 'Especialista en Ascensos',
    perk: 'Atracción de ofertas de clubes de Segunda División y Primera B.',
    color: 'blue',
    stars: 3
  },
  FIRST_TIER_PRO: {
    id: 'FIRST_TIER_PRO',
    min: 61,
    max: 75,
    title: 'DT de Primera División',
    subtitle: 'Técnico de Máxima Categoría',
    perk: 'Imán de patrocinadores de elite y atención de la prensa nacional.',
    color: 'purple',
    stars: 4
  },
  CONTINENTAL_ELITE: {
    id: 'CONTINENTAL_ELITE',
    min: 76,
    max: 90,
    title: 'Elite Continental',
    subtitle: 'Estratega Internacional',
    perk: 'Respeto arbitral (-10% amarillas por protestas) y ofertas de Selección.',
    color: 'amber',
    stars: 5
  },
  WORLD_LEGEND: {
    id: 'WORLD_LEGEND',
    min: 91,
    max: 100,
    title: 'Mito del Fútbol Mundial',
    subtitle: 'Leyenda de los Banquillos',
    perk: 'Inercia de prestigio total y aura imponente sobre los rivales.',
    color: 'yellow',
    stars: 5
  }
}

export const REPUTATION_DELTAS = {
  regular_win: 0.25,
  regular_loss: -0.25,
  derby_win: 1.50,
  derby_loss: -1.50,
  tier_5_title: 8.0,
  tier_4_title: 10.0,
  tier_3_title: 12.0,
  tier_2_title: 15.0,
  tier_1_title: 20.0,
  continental_title: 25.0,
  promotion: 15.0,
  relegation: -15.0,
  dismissal: -8.0,
  resignation: -5.0
}

export const reputationApi = {
  /**
   * Determina el rango de prestigio correspondiente a un puntaje
   */
  getRankForScore(score = 20) {
    const s = Math.max(1, Math.min(100, Math.round(score)))
    if (s <= 20) return { ...REPUTATION_RANKS.LOCAL_UNKNOWN, currentScore: s, nextRank: REPUTATION_RANKS.REGIONAL_PROSPECT, pointsToNext: 21 - s }
    if (s <= 40) return { ...REPUTATION_RANKS.REGIONAL_PROSPECT, currentScore: s, nextRank: REPUTATION_RANKS.ASCENT_SPECIALIST, pointsToNext: 41 - s }
    if (s <= 60) return { ...REPUTATION_RANKS.ASCENT_SPECIALIST, currentScore: s, nextRank: REPUTATION_RANKS.FIRST_TIER_PRO, pointsToNext: 61 - s }
    if (s <= 75) return { ...REPUTATION_RANKS.FIRST_TIER_PRO, currentScore: s, nextRank: REPUTATION_RANKS.CONTINENTAL_ELITE, pointsToNext: 76 - s }
    if (s <= 90) return { ...REPUTATION_RANKS.CONTINENTAL_ELITE, currentScore: s, nextRank: REPUTATION_RANKS.WORLD_LEGEND, pointsToNext: 91 - s }
    return { ...REPUTATION_RANKS.WORLD_LEGEND, currentScore: s, nextRank: null, pointsToNext: 0 }
  },

  /**
   * Aplica una variación autoritativa de reputación con idempotencia y ledger
   */
  async applyReputationDelta({
    managerId,
    eventType,
    sourceEntityId = null,
    delta = 0,
    description = '',
    careerId = null
  }) {
    if (!managerId) return null

    // 1. Idempotencia: Verificar si este evento ya fue procesado en el ledger
    if (sourceEntityId && eventType) {
      const { data: existing } = await supabase
        .from('manager_reputation_ledger')
        .select('id, reputation_after')
        .eq('manager_id', managerId)
        .eq('event_type', eventType)
        .eq('source_entity_id', String(sourceEntityId))
        .maybeSingle()

      if (existing) {
        return {
          alreadyApplied: true,
          reputation: existing.reputation_after
        }
      }
    }

    // 2. Obtener datos actuales del DT
    const { data: manager, error: mgrErr } = await supabase
      .from('managers')
      .select('reputation, peak_career_reputation, reputation_rank')
      .eq('id', managerId)
      .single()

    if (mgrErr || !manager) {
      console.warn('No se pudo encontrar al DT para actualizar reputación:', mgrErr)
      return null
    }

    const currentRep = Number(manager.reputation || 20)
    let effectiveDelta = Number(delta || 0)

    // Regla 32.2 — Inercia de Prestigio: DTs de Elite (>= 76 pts) amortiguan caídas ordinarias al 50%
    if (currentRep >= 76 && effectiveDelta < 0 && eventType === 'MATCH_RESULT') {
      effectiveDelta = effectiveDelta * 0.5
    }

    // Regla 32.1 — Techo Clamped de 1 a 100
    const rawNewRep = currentRep + effectiveDelta
    const newRep = Math.max(1, Math.min(100, Math.round(rawNewRep * 10) / 10))
    const integerClampedRep = Math.max(1, Math.min(100, Math.round(newRep)))

    const oldRankInfo = this.getRankForScore(currentRep)
    const newRankInfo = this.getRankForScore(integerClampedRep)
    const rankChanged = oldRankInfo.id !== newRankInfo.id
    const currentPeak = Number(manager.peak_career_reputation || currentRep)
    const newPeak = Math.max(currentPeak, integerClampedRep)

    // 3. Persistir actualización en managers
    await supabase
      .from('managers')
      .update({
        reputation: integerClampedRep,
        reputation_rank: newRankInfo.id,
        peak_career_reputation: newPeak
      })
      .eq('id', managerId)

    // 4. Registrar en ledger inmutable (Regla de Dominio)
    try {
      await supabase
        .from('manager_reputation_ledger')
        .insert({
          career_id: careerId,
          manager_id: managerId,
          event_type: eventType,
          delta_amount: effectiveDelta,
          reputation_after: integerClampedRep,
          source_entity_id: sourceEntityId ? String(sourceEntityId) : null,
          description: description || `Variación por ${eventType}`
        })
    } catch (ledgerErr) {
      console.warn('Aviso: no se pudo persistir manager_reputation_ledger:', ledgerErr)
    }

    // 5. Auditoría
    try {
      await auditApi.logAction({
        whoId: managerId,
        action: 'REPUTATION_DELTA_LOGGED',
        entityType: 'manager',
        entityId: managerId,
        stateBefore: { reputation: currentRep, rank: oldRankInfo.id },
        stateAfter: {
          reputation: integerClampedRep,
          rank: newRankInfo.id,
          delta: effectiveDelta,
          eventType,
          sourceEntityId
        }
      })

      if (rankChanged && integerClampedRep > currentRep) {
        await auditApi.logAction({
          whoId: managerId,
          action: 'REPUTATION_RANK_INCREASED',
          entityType: 'manager',
          entityId: managerId,
          stateBefore: { rank: oldRankInfo.id },
          stateAfter: { rank: newRankInfo.id, title: newRankInfo.title }
        })
      }
    } catch (audErr) {
      console.warn('Aviso auditoría reputación:', audErr)
    }

    // 6. Invalidar cachés locales
    queryCache.invalidate('manager:')
    queryCache.invalidate('dashboard:')

    return {
      success: true,
      oldRep: currentRep,
      newRep: integerClampedRep,
      delta: effectiveDelta,
      rank: newRankInfo,
      rankChanged,
      isUpgrade: rankChanged && integerClampedRep > currentRep
    }
  },

  /**
   * Obtiene el perfil completo de prestigio del DT
   */
  async getReputationProfile(managerId) {
    if (!managerId) return null

    const { data: mgr } = await supabase
      .from('managers')
      .select('reputation, peak_career_reputation, reputation_rank')
      .eq('id', managerId)
      .maybeSingle()

    const score = Number(mgr?.reputation || 20)
    const peak = Number(mgr?.peak_career_reputation || score)
    const rankInfo = this.getRankForScore(score)

    // Obtener últimos movimientos del ledger
    const { data: ledger } = await supabase
      .from('manager_reputation_ledger')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false })
      .limit(15)

    return {
      score,
      peak,
      rank: rankInfo,
      hasRefereeRespect: score >= 76, // Regla 32.3
      hasSponsorBonus: score >= 60,   // Regla 32.4
      recentLedger: ledger || []
    }
  },

  /**
   * Obtiene el historial del ledger de reputación
   */
  async getReputationHistory(managerId, limit = 20) {
    const { data, error } = await supabase
      .from('manager_reputation_ledger')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return data || []
  }
}
