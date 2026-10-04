import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const INJURY_SEVERITY = {
  MINOR: {
    key: 'MINOR',
    name: 'Leve',
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    minWeeks: 1,
    maxWeeks: 2,
    description: 'Sobrecarga muscular, contractura o contusión. Baja corta de 1 a 2 semanas.'
  },
  MODERATE: {
    key: 'MODERATE',
    name: 'Moderada',
    badgeColor: 'text-orange-400 bg-orange-950/40 border-orange-800/60',
    minWeeks: 3,
    maxWeeks: 6,
    description: 'Desgarro fibrilar o esguince articular. Recuperación de 3 a 6 semanas.'
  },
  SEVERE: {
    key: 'SEVERE',
    name: 'Grave',
    badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
    minWeeks: 7,
    maxWeeks: 16,
    description: 'Fractura, pubalgia crónica o rotura fascial. Convalecencia prolongada de 7 a 16 semanas.'
  },
  CATASTROPHIC: {
    key: 'CATASTROPHIC',
    name: 'Catastrófica',
    badgeColor: 'text-red-500 bg-red-950/60 border-red-700/80',
    minWeeks: 17,
    maxWeeks: 36,
    description: 'Rotura de ligamentos cruzados (LCA) o tendón de Aquiles. Riesgo de secuelas permanentes.'
  }
}

export const SAMPLE_INJURIES = {
  MINOR: [
    'Sobrecarga muscular en isquiotibiales',
    'Contractura aguda en gemelo',
    'Contusión fuerte en cuádriceps',
    'Distensión leve de aductor derecho'
  ],
  MODERATE: [
    'Desgarro fibrilar grado II en bíceps femoral',
    'Esguince de tobillo con compromiso ligamentario',
    'Distensión de ligamento lateral interno de rodilla',
    'Fascitis plantar aguda'
  ],
  SEVERE: [
    'Fractura diafisaria de peroné',
    'Pubalgia crónica rebelde con dolor agudo',
    'Desgarro fascial complejo con edema',
    'Esguince grado III con distensión capsular'
  ],
  CATASTROPHIC: [
    'Rotura completa de ligamento cruzado anterior (LCA)',
    'Rotura del tendón de Aquiles',
    'Fractura expuesta de tibia y peroné'
  ]
}

export const injuriesApi = {
  /**
   * Calcula la probabilidad de lesión según fatiga acumulada y estado del campo
   */
  calculateInjuryRisk(player, pitchQuality = 70) {
    let baseProb = 0.025 // 2.5% base

    const fitness = player?.state_fitness ?? 70
    if (fitness < 50) {
      baseProb *= 5.0
    } else if (fitness < 65) {
      baseProb *= 3.0
    } else if (fitness < 80) {
      baseProb *= 1.5
    }

    if (pitchQuality < 40) {
      baseProb *= 1.9
    } else if (pitchQuality < 60) {
      baseProb *= 1.4
    }

    return Math.min(0.65, baseProb)
  },

  /**
   * Registra una nueva lesión médica autoritativa
   */
  async registerInjury(clubId, playerId, options = {}) {
    if (!clubId || !playerId) throw new Error('Parámetros de club y jugador requeridos')

    // Obtener datos del futbolista
    const { data: player } = await supabase
      .from('players')
      .select('id, first_name, last_name, age, position, state_fitness, overall, club_id')
      .eq('id', playerId)
      .single()

    if (!player) throw new Error('Futbolista no encontrado')

    // Determinar severidad
    let tier = options.severity_tier
    if (!tier) {
      const roll = Math.random()
      if (roll < 0.65) tier = 'MINOR'
      else if (roll < 0.90) tier = 'MODERATE'
      else if (roll < 0.98) tier = 'SEVERE'
      else tier = 'CATASTROPHIC'
    }

    const tierConfig = INJURY_SEVERITY[tier] || INJURY_SEVERITY.MINOR
    const sampleList = SAMPLE_INJURIES[tier] || SAMPLE_INJURIES.MINOR
    const injuryName = options.injury_type || sampleList[Math.floor(Math.random() * sampleList.length)]

    const weeks = options.weeks_total || Math.floor(Math.random() * (tierConfig.maxWeeks - tierConfig.minWeeks + 1)) + tierConfig.minWeeks
    const context = options.occurred_in_context || 'MATCH'

    // Secuela permanente en lesiones catastróficas para veteranos (> 29 años)
    let permLoss = null
    if (tier === 'CATASTROPHIC' && (player.age || 25) >= 29) {
      permLoss = { pace: -3, agility: -2, stamina: -3 }
    } else if (tier === 'SEVERE' && (player.age || 25) >= 32) {
      permLoss = { pace: -1, stamina: -2 }
    }

    // 1. Insertar en player_injuries
    const { data: injuryRecord, error: injuryErr } = await supabase
      .from('player_injuries')
      .insert({
        career_id: options.career_id || null,
        club_id: clubId,
        player_id: playerId,
        injury_type: injuryName,
        severity_tier: tier,
        occurred_in_context: context,
        weeks_total: weeks,
        weeks_remaining: weeks,
        is_cleared: false,
        permanent_attribute_loss: permLoss
      })
      .select()
      .single()

    if (injuryErr) throw injuryErr

    // 2. Actualizar estado del futbolista
    await supabase
      .from('players')
      .update({
        is_injured: true,
        injury_days: weeks * 7,
        injury_type: injuryName,
        state_fitness: Math.min(player.state_fitness || 70, 30)
      })
      .eq('id', playerId)

    queryCache.invalidate(`infirmary:${clubId}`)
    queryCache.invalidate(`squad:${clubId}`)

    return injuryRecord
  },

  /**
   * Obtiene la enfermería / parte médico del club
   */
  async getClubInfirmary(clubId) {
    if (!clubId) return []

    const cached = queryCache.get(`infirmary:${clubId}`)
    if (cached) return cached

    const { data, error } = await supabase
      .from('player_injuries')
      .select(`
        *,
        players:player_id (
          id,
          first_name,
          last_name,
          age,
          position,
          number,
          overall,
          state_fitness,
          photo_url
        )
      `)
      .eq('club_id', clubId)
      .eq('is_cleared', false)
      .order('weeks_remaining', { ascending: false })

    if (error) {
      console.error('Error fetching infirmary:', error)
      return []
    }

    queryCache.set(`infirmary:${clubId}`, data, 30000)
    return data || []
  },

  /**
   * Obtiene el historial clínico de un futbolista
   */
  async getPlayerMedicalHistory(playerId) {
    if (!playerId) return []

    const { data, error } = await supabase
      .from('player_injuries')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching player medical history:', error)
      return []
    }

    return data || []
  },

  /**
   * Procesa la recuperación semanal de lesionados con bonificación de cuerpo médico
   */
  async processWeeklyInjuriesRecovery(clubId) {
    if (!clubId) return { recovered: 0, ongoing: 0 }

    // Obtener lesionados activos
    const { data: activeInjuries, error } = await supabase
      .from('player_injuries')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_cleared', false)

    if (error || !activeInjuries || activeInjuries.length === 0) {
      return { recovered: 0, ongoing: 0 }
    }

    // Evaluar calidad del cuerpo médico (Fase 19)
    let physioBonus = 0
    try {
      const { staffApi } = await import('./staff')
      const staffList = await staffApi.getStaff(clubId)
      // El rol real del cuerpo médico es PHYSIO; skill_rating va de 1 a 20 (14 equivale al 70%)
      const physio = (staffList || []).find(s => s.role === 'PHYSIO')
      if (physio && (physio.skill_rating || 0) >= 14) {
        physioBonus = 0.5 // Descuenta medio punto extra de semana
      }
    } catch (e) {
      // Ignorar si staff no está configurado
    }

    let recoveredCount = 0
    let ongoingCount = 0

    for (const record of activeInjuries) {
      // Descontar semana
      let discount = 1
      if (physioBonus > 0 && Math.random() < physioBonus) {
        discount = 2 // El fisio aceleró la recuperación
      }

      const remaining = Math.max(0, record.weeks_remaining - discount)

      if (remaining <= 0) {
        // Alta médica definitiva
        await supabase
          .from('player_injuries')
          .update({
            weeks_remaining: 0,
            is_cleared: true,
            cleared_at: new Date().toISOString()
          })
          .eq('id', record.id)

        // Habilitar futbolista con condición física moderada
        await supabase
          .from('players')
          .update({
            is_injured: false,
            injury_days: 0,
            injury_type: null,
            state_fitness: 70
          })
          .eq('id', record.player_id)

        recoveredCount++
      } else {
        // Aún en tratamiento
        await supabase
          .from('player_injuries')
          .update({
            weeks_remaining: remaining
          })
          .eq('id', record.id)

        await supabase
          .from('players')
          .update({
            injury_days: remaining * 7
          })
          .eq('id', record.player_id)

        ongoingCount++
      }
    }

    queryCache.invalidate(`infirmary:${clubId}`)
    queryCache.invalidate(`squad:${clubId}`)

    return { recovered: recoveredCount, ongoing: ongoingCount }
  },

  /**
   * Mecánica de Infiltración Médica para un partido crucial
   * Regla: Permitido solo en MINOR o MODERATE con semanas restantes <= 2.
   * Riesgo del 50% de éxito o recaída severa.
   */
  async authorizeInfiltration(clubId, playerId, fixtureId = null) {
    if (!clubId || !playerId) throw new Error('Parámetros incompletos')

    // 1. Verificar lesión activa del futbolista
    const { data: injury } = await supabase
      .from('player_injuries')
      .select('*')
      .eq('player_id', playerId)
      .eq('club_id', clubId)
      .eq('is_cleared', false)
      .maybeSingle()

    if (!injury) {
      throw new Error('El jugador no tiene ninguna lesión activa en este momento.')
    }

    if (injury.severity_tier === 'SEVERE' || injury.severity_tier === 'CATASTROPHIC') {
      throw new Error('El cuerpo médico rechaza categóricamente infiltrar una lesión de grado ' + injury.severity_tier + '. Es un riesgo inaceptable.')
    }

    if (injury.weeks_remaining > 2) {
      throw new Error('La lesión se encuentra en fase aguda (restan ' + injury.weeks_remaining + ' semanas). El protocolo médico exige un máximo de 2 semanas para evaluar infiltración.')
    }

    // 2. Tirada de riesgo (50% éxito, 50% catástrofe)
    const roll = Math.random()
    const isSuccess = roll >= 0.50

    if (isSuccess) {
      // Éxito: Habilitado para jugar bajo anestesia local
      await supabase
        .from('players')
        .update({
          is_injured: false,
          state_fitness: 60
        })
        .eq('id', playerId)

      await supabase.from('medical_infiltrations').insert({
        club_id: clubId,
        player_id: playerId,
        fixture_id: fixtureId,
        was_successful: true
      })

      queryCache.invalidate(`infirmary:${clubId}`)
      queryCache.invalidate(`squad:${clubId}`)

      return {
        success: true,
        message: 'Infiltración médica exitosa. El futbolista soportó la anestesia y está habilitado con 60% de aptitud para jugar.'
      }
    } else {
      // Fracaso: Recaída catastrófica a SEVERE (+10 semanas) con secuela permanente
      const newWeeks = injury.weeks_remaining + 10
      const resultingName = 'Recaída grave post-infiltración: rotura fibrilar con secuela'
      const permLoss = { pace: -2, stamina: -2 }

      const { data: updatedInjury } = await supabase
        .from('player_injuries')
        .update({
          injury_type: resultingName,
          severity_tier: 'SEVERE',
          weeks_total: injury.weeks_total + 10,
          weeks_remaining: newWeeks,
          permanent_attribute_loss: permLoss
        })
        .eq('id', injury.id)
        .select()
        .single()

      await supabase
        .from('players')
        .update({
          is_injured: true,
          injury_days: newWeeks * 7,
          injury_type: resultingName,
          state_fitness: 25
        })
        .eq('id', playerId)

      await supabase.from('medical_infiltrations').insert({
        club_id: clubId,
        player_id: playerId,
        fixture_id: fixtureId,
        was_successful: false,
        resulting_injury_id: updatedInjury?.id || injury.id
      })

      queryCache.invalidate(`infirmary:${clubId}`)
      queryCache.invalidate(`squad:${clubId}`)

      return {
        success: false,
        message: '¡Desastre en el vestuario! La zona infiltrada colapsó ante el esfuerzo. Se agravó a lesión GRAVE (+10 semanas) y sufrirá secuelas físicas permanentes (-2 ritmo, -2 resistencia).'
      }
    }
  }
}
