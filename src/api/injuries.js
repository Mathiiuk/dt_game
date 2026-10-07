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
          shirt_number,
          overall,
          attr_overall,
          state_fitness
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
  /**
   * Con `options.deferPlayerWrite` no escribe a los jugadores: devuelve `playerUpdates` para que quien llama los junte
   * con los suyos en una sola escritura (la tabla de lesiones sí se actualiza).
   */
  async processWeeklyInjuriesRecovery(clubId, options = {}) {
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

    // Se calculan todas las altas/avances y se escriben en lote (2 llamadas en vez de 2 UPDATE por lesión)
    const injuryRows = []
    const playerRows = []

    for (const record of activeInjuries) {
      // Descontar semana
      let discount = 1
      if (physioBonus > 0 && Math.random() < physioBonus) {
        discount = 2 // El fisio aceleró la recuperación
      }

      const remaining = Math.max(0, record.weeks_remaining - discount)

      if (remaining <= 0) {
        // Alta médica definitiva: habilita al futbolista con condición física moderada
        injuryRows.push({ id: record.id, weeks_remaining: 0, is_cleared: true })
        playerRows.push({ id: record.player_id, is_injured: false, injury_days: 0, injury_type: null, state_fitness: 70 })
        recoveredCount++
      } else {
        // Aún en tratamiento
        injuryRows.push({ id: record.id, weeks_remaining: remaining, is_cleared: false })
        playerRows.push({ id: record.player_id, injury_days: remaining * 7 })
        ongoingCount++
      }
    }

    const { playerApi } = await import('./player')
    await Promise.all([
      supabase.rpc('batch_update_injuries', { rows: injuryRows }),
      options.deferPlayerWrite ? Promise.resolve() : playerApi.batchUpdate(playerRows)
    ])

    queryCache.invalidate(`infirmary:${clubId}`)
    queryCache.invalidate(`squad:${clubId}`)

    const summary = { recovered: recoveredCount, ongoing: ongoingCount }
    // (antes terminaba con `return injuryRecord`, una variable que no existe en esta función: lanzaba un error al final)
    return options.deferPlayerWrite ? { ...summary, playerUpdates: playerRows } : summary
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
      throw new Error('El médico no lo infiltra: la lesión es grave y el riesgo es demasiado alto.')
    }

    if (injury.weeks_remaining > 2) {
      throw new Error('Todavía no se lo puede infiltrar: le faltan ' + injury.weeks_remaining + ' semanas y solo se puede cuando quedan 2 o menos.')
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
        message: 'La infiltración salió bien: puede jugar el próximo partido, al 60% de su físico.'
      }
    } else {
      // Fracaso: Recaída catastrófica a SEVERE (+10 semanas) con secuela permanente
      const newWeeks = injury.weeks_remaining + 10
      const resultingName = 'Recaída grave después de infiltrarlo: desgarro con secuela'
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
        message: 'La infiltración salió mal: la lesión se agravó. Suma 10 semanas de baja y pierde 2 puntos de ritmo y 2 de resistencia para siempre.'
      }
    }
  }
}
