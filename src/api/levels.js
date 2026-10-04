import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'

export const MAX_MANAGER_LEVEL = 50

export const XP_SOURCES = {
  MATCH_WON: 150,
  MATCH_DRAWN: 50,
  DERBY_BONUS: 75,
  CLEAN_SHEET: 25,
  LEAGUE_TITLE: 2500,
  PROMOTION: 1500,
  BOARD_OBJECTIVE: 500,
  YOUTH_DEBUT: 100
}

export const MANAGER_PERKS_CATALOG = {
  TACTIC_PRESET_SLOT_2: {
    code: 'TACTIC_PRESET_SLOT_2',
    title: 'Pizarrón Alternativo',
    description: 'Permite guardar y alternar entre esquemas tácticos secundarios durante los partidos.',
    minLevel: 2
  },
  MOTIVATION_HALF_TIME: {
    code: 'MOTIVATION_HALF_TIME',
    title: 'Discurso de Entretiempo',
    description: 'Aumenta un 25% el impacto anímico de las charlas tácticas en el entretiempo.',
    minLevel: 3
  },
  YOUTH_POTENTIAL_DETECTOR: {
    code: 'YOUTH_POTENTIAL_DETECTOR',
    title: 'Ojo Clínico de Cantera',
    description: 'Revela el rango de potencial estimado (+68) de las promesas del club.',
    minLevel: 5
  },
  NEGOTIATION_MASTERY: {
    code: 'NEGOTIATION_MASTERY',
    title: 'Negociador de Vestuario',
    description: 'Reduce las pretensiones salariales iniciales en fichajes y renovaciones un 8%.',
    minLevel: 7
  },
  PHYSICAL_RECOVERY: {
    code: 'PHYSICAL_RECOVERY',
    title: 'Preparación de Alta Intensidad',
    description: 'Reduce la fatiga física acumulada entre partidos en un 10%.',
    minLevel: 10
  }
}

/**
 * Curva polinómica estricta: XP(level) = 150 * (level - 1)^1.6
 */
export function calculateXpForLevel(level) {
  if (level <= 1) return 0
  return Math.round(150 * Math.pow(level - 1, 1.6))
}

export function getHonorificTitle(level) {
  if (level < 6) return 'DT de Potrero'
  if (level < 11) return 'DT Regional Promesa'
  if (level < 21) return 'Táctico del Ascenso'
  if (level < 31) return 'Estratega Consagrado'
  if (level < 41) return 'Maestro Táctico Nacional'
  return 'Leyenda Suprema del Banco'
}

export const levelsApi = {
  /**
   * Genera el desglose completo del estado de nivel a partir del XP acumulado
   */
  async getLevelInfo(totalXp = 0) {
    let currentLevel = 1
    for (let lvl = 1; lvl <= MAX_MANAGER_LEVEL; lvl++) {
      if (totalXp >= calculateXpForLevel(lvl)) {
        currentLevel = lvl
      } else {
        break
      }
    }

    const currentLevelXp = calculateXpForLevel(currentLevel)
    const nextLevelXp = currentLevel < MAX_MANAGER_LEVEL ? calculateXpForLevel(currentLevel + 1) : currentLevelXp

    let progressPercent = 100
    if (currentLevel < MAX_MANAGER_LEVEL) {
      const xpIntoCurrentLevel = Math.max(0, totalXp - currentLevelXp)
      const xpSpan = Math.max(1, nextLevelXp - currentLevelXp)
      progressPercent = Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpSpan) * 100))
    }

    return {
      currentLevel,
      nextLevel: currentLevel < MAX_MANAGER_LEVEL ? currentLevel + 1 : null,
      xp: totalXp,
      currentLevelThreshold: currentLevelXp,
      xpRequiredForNext: nextLevelXp,
      xpRemainingForNext: Math.max(0, nextLevelXp - totalXp),
      progressPercent: Math.round(progressPercent),
      title: getHonorificTitle(currentLevel)
    }
  },

  /**
   * Adjudicación autoritativa e idempotente de XP con registro inmutable en ledger
   */
  async awardXp(managerId, sourceType, sourceEntityId, customAmount = null) {
    if (!managerId) return null

    const xpToAward = customAmount !== null ? customAmount : (XP_SOURCES[sourceType] || 50)
    if (xpToAward <= 0) return { awarded: false, xpEarned: 0 }

    // 1. Idempotencia: Verificar en manager_xp_ledger
    if (sourceEntityId) {
      try {
        const { data: existing } = await supabase
          .from('manager_xp_ledger')
          .select('id')
          .eq('manager_id', managerId)
          .eq('source_type', sourceType)
          .eq('source_entity_id', String(sourceEntityId))
          .maybeSingle()

        if (existing) {
          return { awarded: false, duplicate: true, xpEarned: 0 }
        }
      } catch (e) {
        console.warn('Verificación de idempotencia en manager_xp_ledger:', e)
      }
    }

    // 2. Obtener datos actuales del DT
    const { data: manager, error: fetchErr } = await supabase
      .from('managers')
      .select('id, xp, level, unallocated_perk_points, reputation')
      .eq('id', managerId)
      .single()

    if (fetchErr || !manager) throw new Error(fetchErr?.message || 'DT no encontrado')

    const oldXp = Number(manager.xp) || 0
    const oldLevel = Number(manager.level) || 1
    const newTotalXp = oldXp + xpToAward

    // 3. Evaluar subida de nivel
    const levelInfo = await this.getLevelInfo(newTotalXp)
    const newLevel = levelInfo.currentLevel
    const levelsGained = Math.max(0, newLevel - oldLevel)
    const newPerkPoints = (Number(manager.unallocated_perk_points) || 0) + levelsGained
    const newReputation = (Number(manager.reputation) || 10) + (levelsGained * 2)

    // 4. Actualizar tabla managers
    const { data: updatedManager, error: updateErr } = await supabase
      .from('managers')
      .update({
        xp: newTotalXp,
        level: newLevel,
        unallocated_perk_points: newPerkPoints,
        reputation: newReputation
      })
      .eq('id', managerId)
      .select()
      .single()

    if (updateErr) throw new Error(updateErr.message)

    // 5. Insertar registro inmutable en ledger
    try {
      await supabase.from('manager_xp_ledger').insert({
        manager_id: managerId,
        source_type: sourceType,
        source_entity_id: sourceEntityId ? String(sourceEntityId) : null,
        xp_awarded: xpToAward,
        level_before: oldLevel,
        level_after: newLevel
      })
    } catch (e) {
      console.warn('No se pudo persistir en manager_xp_ledger:', e)
    }

    // 6. Auditoría de eventos
    if (levelsGained > 0) {
      try {
        await auditApi.logAction({
          whoId: managerId,
          action: 'MANAGER_LEVEL_UP',
          entityType: 'manager',
          entityId: managerId,
          stateBefore: { level: oldLevel, xp: oldXp },
          stateAfter: { level: newLevel, xp: newTotalXp, perksAwarded: levelsGained }
        })
      } catch (e) {
        console.warn('Auditoría de subida de nivel:', e)
      }
    }

    // Invalidar caché
    queryCache.invalidate('manager:')

    return {
      awarded: true,
      xpEarned: xpToAward,
      leveledUp: levelsGained > 0,
      oldLevel,
      newLevel,
      levelsGained,
      newTotalXp,
      title: levelInfo.title,
      manager: updatedManager
    }
  },

  /**
   * Canje de puntos de habilidad para desbloquear un Perk
   */
  async unlockPerk(managerId, perkCode) {
    const perk = MANAGER_PERKS_CATALOG[perkCode]
    if (!perk) throw new Error('Habilidad no reconocida en el catálogo.')

    // 1. Obtener puntos disponibles
    const { data: manager } = await supabase
      .from('managers')
      .select('id, level, unallocated_perk_points')
      .eq('id', managerId)
      .single()

    if (!manager || (manager.unallocated_perk_points || 0) < 1) {
      throw new Error('No tienes puntos de habilidad disponibles para desbloquear ventajas.')
    }

    if (manager.level < perk.minLevel) {
      throw new Error(`Esta habilidad requiere Nivel ${perk.minLevel} de Director Técnico.`)
    }

    // 2. Verificar si ya fue desbloqueado
    const { data: existing } = await supabase
      .from('manager_unlocked_perks')
      .select('id')
      .eq('manager_id', managerId)
      .eq('perk_code', perkCode)
      .maybeSingle()

    if (existing) {
      throw new Error('Esta habilidad ya ha sido adquirida previamente.')
    }

    // 3. Insertar perk
    const { error: insertErr } = await supabase
      .from('manager_unlocked_perks')
      .insert({
        manager_id: managerId,
        perk_code: perkCode,
        acquired_at_level: manager.level
      })

    if (insertErr) throw new Error(insertErr.message)

    // 4. Descontar punto de habilidad
    await supabase
      .from('managers')
      .update({
        unallocated_perk_points: Math.max(0, manager.unallocated_perk_points - 1)
      })
      .eq('id', managerId)

    queryCache.invalidate('manager:')
    queryCache.invalidate(`perks:${managerId}`)

    return { success: true, perk }
  },

  /**
   * Obtiene la lista de perks desbloqueados por el DT
   */
  async getUnlockedPerks(managerId) {
    if (!managerId) return []

    return queryCache.fetch(`perks:${managerId}`, async () => {
      const { data, error } = await supabase
        .from('manager_unlocked_perks')
        .select('*')
        .eq('manager_id', managerId)

      if (error) return []
      return (data || []).map(p => ({
        ...p,
        details: MANAGER_PERKS_CATALOG[p.perk_code] || null
      }))
    }, 60000)
  }
}
