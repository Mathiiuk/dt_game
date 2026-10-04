import { supabase } from './supabase'

export const FOCUS_OPTIONS = [
  { 
    id: 'BALANCED', 
    label: 'Equilibrado', 
    desc: 'Desarrolla todas las facetas del juego de forma moderada.',
    attributes: ['pace', 'passing', 'shooting', 'defending'] 
  },
  { 
    id: 'PHYSICAL_STAMINA', 
    label: 'Acondicionamiento Físico', 
    desc: 'Fuerza, velocidad y resistencia. Nota: No aumenta atributos en veteranos > 29 años.',
    attributes: ['pace', 'strength', 'stamina'] 
  },
  { 
    id: 'TACTICAL_DISCIPLINE', 
    label: 'Estructura y Táctica', 
    desc: 'Disciplina defensiva, coberturas y posicionamiento en el terreno.',
    attributes: ['defending'] 
  },
  { 
    id: 'TECHNICAL_PASSING', 
    label: 'Técnica y Distribución', 
    desc: 'Control orientado, visión y precisión de pase corto y largo.',
    attributes: ['passing', 'technique', 'control'] 
  },
  { 
    id: 'ATTACKING_FINISHING', 
    label: 'Definición y Ataque', 
    desc: 'Finalización de jugadas, disparos de media distancia y desmarques.',
    attributes: ['shooting', 'dribbling'] 
  },
  { 
    id: 'DEFENSIVE_STRUCTURE', 
    label: 'Fase Defensiva y Presión', 
    desc: 'Cierre de líneas, entradas limpias e intercepciones tácticas.',
    attributes: ['defending'] 
  },
  { 
    id: 'RECOVERY_REST', 
    label: 'Regenerativo y Descanso', 
    desc: 'Sesión suave sin carga física. +15 de energía neta y 0% de riesgo de lesión.',
    attributes: [] 
  }
]

export const INTENSITY_CONFIG = {
  LOW: { id: 'LOW', label: 'Baja', fitnessCost: 5, injuryBaseProb: 0.001, devMultiplier: 0.6 },
  MEDIUM: { id: 'MEDIUM', label: 'Media', fitnessCost: 10, injuryBaseProb: 0.006, devMultiplier: 1.0 },
  HIGH: { id: 'HIGH', label: 'Alta', fitnessCost: 20, injuryBaseProb: 0.022, devMultiplier: 2.0 }
}

export const INDIVIDUAL_ATTRIBUTES = [
  { id: 'pace', label: 'Velocidad / Ritmo' },
  { id: 'passing', label: 'Pases y Visión' },
  { id: 'shooting', label: 'Definición y Tiro' },
  { id: 'defending', label: 'Entradas y Defensa' },
  { id: 'technique', label: 'Técnica y Control' },
  { id: 'stamina', label: 'Resistencia Aeróbica' }
]

export const trainingApi = {
  /**
   * Obtiene el plan general de entrenamiento del club o inicializa uno por defecto.
   */
  async getClubTrainingPlan(clubId) {
    if (!clubId) return { general_focus: 'BALANCED', intensity_level: 'MEDIUM' }

    try {
      const { data, error } = await supabase
        .from('club_training_plans')
        .select('*')
        .eq('club_id', clubId)
        .maybeSingle()

      if (data) return data

      // Crear plan inicial
      const defaultPlan = {
        club_id: clubId,
        general_focus: 'BALANCED',
        intensity_level: 'MEDIUM',
        updated_at: new Date().toISOString()
      }

      // upsert idempotente: evita 409 (uq_club_training_plan) ante cargas concurrentes
      await supabase
        .from('club_training_plans')
        .upsert(defaultPlan, { onConflict: 'club_id', ignoreDuplicates: true })

      const { data: created, error: insertError } = await supabase
        .from('club_training_plans')
        .select('*')
        .eq('club_id', clubId)
        .maybeSingle()

      if (insertError) {
        return defaultPlan
      }
      return created || defaultPlan
    } catch (e) {
      console.warn('Error leyendo club_training_plans:', e)
      return { general_focus: 'BALANCED', intensity_level: 'MEDIUM' }
    }
  },

  /**
   * Actualiza el plan general de entrenamiento del club con validación autoritativa.
   */
  async updateClubTrainingPlan(clubId, generalFocus, intensityLevel) {
    if (!clubId) throw new Error('Club ID requerido')

    const validFocus = FOCUS_OPTIONS.find(f => f.id === generalFocus)
    if (!validFocus) throw new Error(`Enfoque de entrenamiento no válido: ${generalFocus}`)

    const validIntensity = INTENSITY_CONFIG[intensityLevel]
    if (!validIntensity) throw new Error(`Nivel de intensidad no válido: ${intensityLevel}`)

    try {
      const { data, error } = await supabase
        .from('club_training_plans')
        .upsert({
          club_id: clubId,
          general_focus: generalFocus,
          intensity_level: intensityLevel,
          updated_at: new Date().toISOString()
        }, { onConflict: 'club_id' })
        .select()
        .single()

      if (error) throw error

      // Sincronizar en clubs para compatibilidad legacy
      const intensityNumber = intensityLevel === 'HIGH' ? 80 : (intensityLevel === 'LOW' ? 20 : 50)
      await supabase
        .from('clubs')
        .update({
          training_focus: generalFocus,
          training_intensity: intensityNumber
        })
        .eq('id', clubId)

      return data
    } catch (e) {
      console.warn('Fallback actualizando plan de entrenamiento:', e)
      return { club_id: clubId, general_focus: generalFocus, intensity_level: intensityLevel }
    }
  },

  /**
   * Obtiene asignaciones de entrenamiento individual de los jugadores del club.
   */
  async getPlayerAssignments(clubId) {
    if (!clubId) return []

    try {
      const { data, error } = await supabase
        .from('player_training_assignments')
        .select('*')
        .eq('club_id', clubId)

      if (error) throw error
      return data || []
    } catch (e) {
      console.warn('Error leyendo player_training_assignments:', e)
      return []
    }
  },

  /**
   * Asigna un foco individual a un jugador específico (promesa o refuerzo).
   */
  async setPlayerAssignment(clubId, playerId, focusAttribute, retrainingPosition = null) {
    if (!clubId || !playerId) throw new Error('Datos requeridos incompletos')

    try {
      const { data, error } = await supabase
        .from('player_training_assignments')
        .upsert({
          club_id: clubId,
          player_id: playerId,
          focus_attribute: focusAttribute,
          retraining_position: retrainingPosition,
          familiarity_percentage: 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'player_id' })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (e) {
      console.warn('Error guardando player_training_assignments:', e)
      return { club_id: clubId, player_id: playerId, focus_attribute: focusAttribute }
    }
  },

  /**
   * Ejecuta el cálculo semanal autoritativo de entrenamiento durante la cascada de avance.
   */
  async processWeeklyTraining(clubId, weekNumber = 1, careerId = null) {
    if (!clubId) return null

    // 1. Idempotencia: Verificar si ya se procesó esta semana para este club
    try {
      const { data: existingLog } = await supabase
        .from('training_execution_logs')
        .select('*')
        .eq('club_id', clubId)
        .eq('week_number', weekNumber)
        .maybeSingle()

      if (existingLog) {
        return {
          idempotent: true,
          focus: existingLog.focus_applied,
          intensity: existingLog.intensity_applied,
          injuriesSustained: existingLog.injuries_sustained,
          attributesImproved: existingLog.attributes_improved_count
        }
      }
    } catch (e) {
      // Ignorar fallo de lectura de log
    }

    // 2. Obtener plan y jugadores
    const plan = await this.getClubTrainingPlan(clubId)
    const assignments = await this.getPlayerAssignments(clubId)
    const assignmentMap = new Map(assignments.map(a => [a.player_id, a.focus_attribute]))

    const intensityConf = INTENSITY_CONFIG[plan.intensity_level] || INTENSITY_CONFIG.MEDIUM
    const isRecovery = plan.general_focus === 'RECOVERY_REST'

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_retired', false)

    if (!players || players.length === 0) return null

    let injuriesCount = 0
    let improvementsCount = 0
    let totalFitnessCost = 0

    // 3. Iterar futbolistas
    const trainingUpdates = []
    for (const p of players) {
      let fitness = p.state_fitness || 75
      let injuryDays = p.injury_days || 0
      let injuryType = p.injury_type || null
      let isInjured = p.is_injured || (injuryDays > 0)

      // Si ya está lesionado, el entrenamiento está pausado para él
      if (isInjured) continue

      let pace = p.attr_pace || 50
      let passing = p.attr_passing || 50
      let defending = p.attr_defending || 50
      let shooting = p.attr_shooting || 50
      const potential = p.attr_potential || 65
      const age = p.age || 22

      if (isRecovery) {
        // Enfoque regenerativo: +15 fitness neto adicional, 0% riesgo lesión
        fitness = Math.min(100, fitness + 15)
      } else {
        // Coste de fitness según intensidad
        const cost = intensityConf.fitnessCost
        fitness = Math.max(0, fitness - cost)
        totalFitnessCost += cost

        // Tirada de lesión en entrenamiento:
        // Aumenta si el fitness es bajo (< 60) y por la intensidad
        const fitnessRiskFactor = fitness < 60 ? 3.0 : 1.0
        const injuryChance = intensityConf.injuryBaseProb * fitnessRiskFactor

        if (Math.random() < injuryChance) {
          injuryDays = Math.floor(Math.random() * 14) + 7
          injuryType = 'Sobrecarga Muscular en Entrenamiento'
          isInjured = true
          injuriesCount++
        } else {
          // Desarrollo de atributos si no se lesionó y tiene margen de potencial
          const currentMax = Math.max(pace, passing, defending, shooting)
          if (currentMax < potential) {
            // Regla 8.1: Jugadores > 29 años no incrementan ritmo/físico
            const isVeteran = age > 29
            const individualFocus = assignmentMap.get(p.id)

            // Probabilidad base de desarrollo por semana
            const isYouth = age < 22
            const youthBonus = isYouth ? 1.5 : 1.0
            const devRoll = Math.random()

            // 15% base modificado por multiplicador de intensidad y juventud
            const targetThreshold = 0.12 * intensityConf.devMultiplier * youthBonus

            if (devRoll < targetThreshold) {
              if (individualFocus === 'pace' && !isVeteran && pace < potential) {
                pace++
                improvementsCount++
              } else if (individualFocus === 'passing' && passing < potential) {
                passing++
                improvementsCount++
              } else if (individualFocus === 'shooting' && shooting < potential) {
                shooting++
                improvementsCount++
              } else if (individualFocus === 'defending' && defending < potential) {
                defending++
                improvementsCount++
              } else {
                // Foco general
                if (plan.general_focus === 'FISICO' || plan.general_focus === 'PHYSICAL_STAMINA') {
                  if (!isVeteran && pace < potential) { pace++; improvementsCount++ }
                } else if (plan.general_focus === 'TECNICO' || plan.general_focus === 'TECHNICAL_PASSING') {
                  if (passing < potential) { passing++; improvementsCount++ }
                } else if (plan.general_focus === 'OFENSIVO' || plan.general_focus === 'ATTACKING_FINISHING') {
                  if (shooting < potential) { shooting++; improvementsCount++ }
                } else if (plan.general_focus === 'TACTICO' || plan.general_focus === 'DEFENSIVE_STRUCTURE') {
                  if (defending < potential) { defending++; improvementsCount++ }
                } else {
                  // Equilibrado
                  const r = Math.random()
                  if (r < 0.25 && !isVeteran && pace < potential) { pace++; improvementsCount++ }
                  else if (r < 0.50 && passing < potential) { passing++; improvementsCount++ }
                  else if (r < 0.75 && defending < potential) { defending++; improvementsCount++ }
                  else if (shooting < potential) { shooting++; improvementsCount++ }
                }
              }
            }
          }
        }
      }

      trainingUpdates.push({
        id: p.id,
        state_fitness: Math.round(fitness),
        injury_days: injuryDays,
        injury_type: injuryType,
        is_injured: isInjured,
        attr_pace: pace,
        attr_passing: passing,
        attr_defending: defending,
        attr_shooting: shooting
      })
    }

    // Un solo UPDATE masivo para todo el plantel (antes: uno por jugador)
    const { playerApi } = await import('./player')
    await playerApi.batchUpdate(trainingUpdates)

    // 4. Registrar auditoría en training_execution_logs
    try {
      await supabase.from('training_execution_logs').insert({
        career_id: careerId,
        club_id: clubId,
        week_number: weekNumber,
        focus_applied: plan.general_focus,
        intensity_applied: plan.intensity_level,
        average_stamina_cost: players.length > 0 ? totalFitnessCost / players.length : 0,
        injuries_sustained: injuriesCount,
        attributes_improved_count: improvementsCount,
        timestamp: new Date().toISOString()
      })
    } catch (logErr) {
      console.warn('Aviso: no se pudo guardar training_execution_logs:', logErr)
    }

    return {
      focus: plan.general_focus,
      intensity: plan.intensity_level,
      injuriesSustained: injuriesCount,
      attributesImproved: improvementsCount,
      playersProcessed: players.length
    }
  }
}
