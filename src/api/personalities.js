import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const PERSONALITY_ARCHETYPES = {
  NATURAL_LEADER: {
    key: 'NATURAL_LEADER',
    name: 'Líder Nato',
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    description: 'Alta determinación y liderazgo. Empuja al grupo en situaciones adversas y es el capitán ideal.'
  },
  MODEL_PROFESSIONAL: {
    key: 'MODEL_PROFESSIONAL',
    name: 'Profesional Ejemplar',
    badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    description: 'Máxima dedicación. Rinde al 100% en los entrenamientos, evoluciona rápido y prolonga su carrera.'
  },
  AMBITIOUS: {
    key: 'AMBITIOUS',
    name: 'Ambicioso Inquieto',
    badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
    description: 'Deseo de gloria y contratos altos. Presiona por aumentos y busca dar el salto a categorías superiores.'
  },
  TEMPERAMENTAL: {
    key: 'TEMPERAMENTAL',
    name: 'Temperamental / Rebelde',
    badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
    description: 'Poca tolerancia a la frustración. Propenso a tarjetas absurdas por reclamar y disputas en el campo.'
  },
  STREET_RESILIENT: {
    key: 'STREET_RESILIENT',
    name: 'Resiliente de Potrero',
    badgeColor: 'text-orange-400 bg-orange-950/40 border-orange-800/60',
    description: 'Forjado en el barro y la adversidad. Rinde al máximo en canchas duras y clásicos con pierna fuerte.'
  },
  SLACKER: {
    key: 'SLACKER',
    name: 'Indolente / Cómodo',
    badgeColor: 'text-zinc-400 bg-zinc-800/50 border-zinc-700/60',
    description: 'Gran talento pero poca disciplina de trabajo. Necesita un tutor exigente para no estancarse.'
  },
  FRAGILE: {
    key: 'FRAGILE',
    name: 'Sensible a la Presión',
    badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    description: 'Baja tolerancia a la presión ambiental. Sufre en tandas de penales o si recibe críticas públicas.'
  }
}

export const SPECIAL_TRAITS_CATALOG = {
  LONG_SHOTS: { key: 'LONG_SHOTS', name: 'Dispara de Media Distancia', icon: 'Zap' },
  DIVES_INTO_TACKLES: { key: 'DIVES_INTO_TACKLES', name: 'Barrida Agresiva al Piso', icon: 'Shield' },
  LEAD_DEFENSE: { key: 'LEAD_DEFENSE', name: 'Comanda la Línea Defensiva', icon: 'Award' },
  FREE_KICK_SPECIALIST: { key: 'FREE_KICK_SPECIALIST', name: 'Especialista en Balón Parado', icon: 'Sparkles' },
  COMPULSIVE_DRIBBLE: { key: 'COMPULSIVE_DRIBBLE', name: 'Gambeta y Regate Individual', icon: 'TrendingUp' }
}

export const personalitiesApi = {
  /**
   * Sincroniza y obtiene la psicología de todos los futbolistas del club
   */
  async syncSquadPersonalities(clubId) {
    if (!clubId) return []

    // 1. Obtener futbolistas del club
    const { data: players } = await supabase
      .from('players')
      .select('id, name, position, overall, age, morale')
      .eq('club_id', clubId)

    const squad = players || []
    if (squad.length === 0) return []

    // 2. Obtener personalidades ya existentes
    const { data: existing } = await supabase
      .from('player_personalities')
      .select('*')
      .in('player_id', squad.map(p => p.id))

    const existingMap = new Map((existing || []).map(p => [p.player_id, p]))
    const toInsert = []

    const archetypesList = [
      'NATURAL_LEADER',
      'MODEL_PROFESSIONAL',
      'AMBITIOUS',
      'TEMPERAMENTAL',
      'STREET_RESILIENT',
      'SLACKER',
      'FRAGILE'
    ]

    for (const p of squad) {
      if (!existingMap.has(p.id)) {
        // Generación pseudo-determinista de rasgos
        let arch = 'STREET_RESILIENT'
        if (p.age >= 29 && p.overall >= 68) arch = 'NATURAL_LEADER'
        else if (p.age <= 19 && Math.random() > 0.6) arch = 'SLACKER'
        else if (p.overall >= 72) arch = 'MODEL_PROFESSIONAL'
        else {
          const randIdx = Math.floor(Math.random() * archetypesList.length)
          arch = archetypesList[randIdx]
        }

        const traits = []
        if (p.position === 'DEL' || p.position === 'EXT') traits.push('LONG_SHOTS')
        if (p.position === 'DEF' || p.position === 'MCD') traits.push('DIVES_INTO_TACKLES')
        if (p.overall >= 70) traits.push('FREE_KICK_SPECIALIST')

        const item = {
          player_id: p.id,
          primary_archetype: arch,
          ambition: Math.floor(Math.random() * 10) + 10,
          professionalism: arch === 'MODEL_PROFESSIONAL' ? 18 : arch === 'SLACKER' ? 6 : Math.floor(Math.random() * 10) + 8,
          loyalty: arch === 'AMBITIOUS' ? 7 : Math.floor(Math.random() * 10) + 10,
          pressure_handling: arch === 'FRAGILE' ? 5 : Math.floor(Math.random() * 10) + 9,
          temperament: arch === 'TEMPERAMENTAL' ? 5 : Math.floor(Math.random() * 10) + 10,
          determination: arch === 'NATURAL_LEADER' ? 18 : Math.floor(Math.random() * 10) + 8,
          special_traits: traits
        }
        toInsert.push(item)
      }
    }

    if (toInsert.length > 0) {
      const { data: inserted } = await supabase
        .from('player_personalities')
        .insert(toInsert)
        .select()

      if (inserted) {
        inserted.forEach(item => existingMap.set(item.player_id, item))
      }
    }

    return squad.map(p => ({
      ...p,
      personality: existingMap.get(p.id) || null
    }))
  },

  /**
   * Asigna un tutor veterano para moldear el profesionalismo de un juvenil
   */
  async assignMentorship(clubId, veteranId, youthId) {
    if (!clubId || !veteranId || !youthId) throw new Error('Parámetros requeridos inválidos')
    if (veteranId === youthId) throw new Error('Un jugador no puede tutelarse a sí mismo')

    // Validar si el veterano ya tiene una tutoría activa
    const { data: active } = await supabase
      .from('player_mentorships')
      .select('id')
      .eq('veteran_player_id', veteranId)
      .eq('status', 'ACTIVE')
      .maybeSingle()

    if (active) {
      throw new Error('El veterano seleccionado ya está apadrinando a otro juvenil en este momento.')
    }

    // Crear tutoría activa
    const { data: created, error } = await supabase
      .from('player_mentorships')
      .insert({
        club_id: clubId,
        veteran_player_id: veteranId,
        youth_player_id: youthId,
        progress_percentage: 0,
        status: 'ACTIVE'
      })
      .select()
      .single()

    if (error) throw error

    // Sincronizar en player_personalities
    await supabase
      .from('player_personalities')
      .update({ mentor_player_id: veteranId })
      .eq('player_id', youthId)

    await supabase.from('personality_events_log').insert({
      player_id: youthId,
      event_type: 'MENTORSHIP_INFLUENCE_APPLIED',
      attribute_shifted: 'Inicio de programa de mentoría con veterano de experiencia.'
    })

    queryCache.invalidate(`mentorships:${clubId}`)
    return created
  },

  /**
   * Obtiene las tutorías y mentorías activas o históricas del club
   */
  async getClubMentorships(clubId) {
    if (!clubId) return []

    const { data, error } = await supabase
      .from('player_mentorships')
      .select(`
        *,
        veteran:veteran_player_id(id, name, position, overall, age),
        youth:youth_player_id(id, name, position, overall, age)
      `)
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error consultando player_mentorships:', error)
      return []
    }
    return data || []
  },

  /**
   * Avanza semanalmente el progreso de todas las mentorías del club (+5%)
   */
  async advanceMentorshipsWeek(clubId) {
    if (!clubId) return

    const { data: activeMentorships } = await supabase
      .from('player_mentorships')
      .select('id, progress_percentage, youth_player_id, veteran_player_id')
      .eq('club_id', clubId)
      .eq('status', 'ACTIVE')

    if (!activeMentorships || activeMentorships.length === 0) return

    for (const m of activeMentorships) {
      const nextProgress = Math.min(100, m.progress_percentage + 5)

      if (nextProgress >= 100) {
        // ¡Mentoría completada con éxito!
        await supabase
          .from('player_mentorships')
          .update({ progress_percentage: 100, status: 'COMPLETED' })
          .eq('id', m.id)

        // Moldear atributos del juvenil hacia el profesionalismo del tutor
        const { data: youthPers } = await supabase
          .from('player_personalities')
          .select('*')
          .eq('player_id', m.youth_player_id)
          .single()

        if (youthPers) {
          const newProf = Math.min(20, (youthPers.professionalism || 10) + 4)
          const newDet = Math.min(20, (youthPers.determination || 10) + 3)
          let newArch = youthPers.primary_archetype

          if (youthPers.primary_archetype === 'SLACKER') {
            newArch = 'STREET_RESILIENT'
          } else if (youthPers.primary_archetype === 'FRAGILE') {
            newArch = 'MODEL_PROFESSIONAL'
          }

          await supabase
            .from('player_personalities')
            .update({
              professionalism: newProf,
              determination: newDet,
              primary_archetype: newArch,
              updated_at: new Date().toISOString()
            })
            .eq('player_id', m.youth_player_id)

          await supabase.from('personality_events_log').insert({
            player_id: m.youth_player_id,
            event_type: 'MENTORSHIP_INFLUENCE_APPLIED',
            attribute_shifted: `Tutoría completada: Profesionalismo (+4), Determinación (+3). Nuevo arquetipo: ${newArch}`
          })
        }
      } else {
        await supabase
          .from('player_mentorships')
          .update({ progress_percentage: nextProgress })
          .eq('id', m.id)
      }
    }

    queryCache.invalidate(`mentorships:${clubId}`)
  }
}
