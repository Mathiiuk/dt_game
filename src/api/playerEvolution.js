import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const CAREER_PHASES = {
  YOUTH_GROWTH: {
    key: 'YOUTH_GROWTH',
    name: 'Joya en Desarrollo',
    ageRange: '16 - 20 años',
    badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    description: 'Crecimiento técnico y físico acelerado. Requiere minutos en cancha para desbloquear su potencial.'
  },
  PRIME_DEVELOPMENT: {
    key: 'PRIME_DEVELOPMENT',
    name: 'Maduración Competitiva',
    ageRange: '21 - 24 años',
    badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    description: 'Consolidación táctica, toma de decisiones y afinamiento en alta competencia.'
  },
  PEAK: {
    key: 'PEAK',
    name: 'Pico de Rendimiento',
    ageRange: '25 - 29 años',
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    description: 'Plenitud física, técnica y psicológica. El futbolista rinde a su máximo nivel histórico.'
  },
  EXPERIENCED_TRANSITION: {
    key: 'EXPERIENCED_TRANSITION',
    name: 'Madurez & Transición',
    ageRange: '30 - 33 años',
    badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
    description: 'Leve merma atlética compensada por jerarquía, liderazgo y lectura posicional.'
  },
  DECLINING: {
    key: 'DECLINING',
    name: 'Declive Natural',
    ageRange: '34+ años',
    badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
    description: 'Pérdida paulatina de velocidad y fondo físico. El profesionalismo prolonga la carrera.'
  },
  RETIREMENT_PENDING: {
    key: 'RETIREMENT_PENDING',
    name: 'Retiro Anunciado',
    ageRange: 'Última temporada',
    badgeColor: 'text-zinc-300 bg-zinc-800/60 border-zinc-700/80',
    description: 'El futbolista colgará las botas al término del campeonato.'
  }
}

export const playerEvolutionApi = {
  /**
   * Determina la fase de carrera según la edad y estado de retiro
   */
  determineCareerPhase(age, isRetiring = false) {
    if (isRetiring) return 'RETIREMENT_PENDING'
    if (age <= 20) return 'YOUTH_GROWTH'
    if (age <= 24) return 'PRIME_DEVELOPMENT'
    if (age <= 29) return 'PEAK'
    if (age <= 33) return 'EXPERIENCED_TRANSITION'
    return 'DECLINING'
  },

  /**
   * Calcula la evolución anual de un futbolista (Reglas 28.1 a 28.4)
   */
  calculateAnnualEvolution(player, personality = null) {
    const currentAge = player.age || 20
    const newAge = currentAge + 1
    const currentOvr = player.overall || player.attr_overall || 50
    const potential = player.potential_rating || player.potential || Math.min(99, currentOvr + 6)
    const minutes = player.minutes_played_season || 0
    const professionalism = personality?.professionalism || 10

    let ovrDelta
    const deltas = {
      pace: 0,
      stamina: 0,
      technique: 0,
      vision: 0,
      composure: 0,
      defending: 0
    }

    let retiring = false
    let futureRole = 'LEAVE_FOOTBALL'

    // 1. Curva Biológica
    if (newAge <= 20) {
      // Regla 28.1: Sin minutos no hay milagro
      if (minutes >= 1800) {
        ovrDelta = Math.floor(Math.random() * 2) + 4 // +4 a +5
        deltas.pace = 2
        deltas.stamina = 2
        deltas.technique = 3
        deltas.vision = 1
      } else if (minutes >= 900) {
        ovrDelta = Math.floor(Math.random() * 2) + 2 // +2 a +3
        deltas.pace = 1
        deltas.stamina = 1
        deltas.technique = 2
      } else if (minutes >= 300) {
        ovrDelta = 1
        deltas.technique = 1
      } else {
        ovrDelta = 0 // Estancamiento
      }
    } else if (newAge <= 24) {
      if (minutes >= 1200) {
        ovrDelta = Math.floor(Math.random() * 2) + 2 // +2 a +3
        deltas.vision = 2
        deltas.technique = 2
        deltas.stamina = 1
      } else if (minutes >= 500) {
        ovrDelta = 1
        deltas.vision = 1
      } else {
        ovrDelta = 0
      }
    } else if (newAge <= 29) {
      // Pico
      if (minutes >= 1500 && currentOvr < potential) {
        ovrDelta = Math.random() > 0.5 ? 1 : 0
        deltas.composure = 1
      } else {
        ovrDelta = 0
      }
    } else if (newAge <= 33) {
      // Madurez y compensación táctica
      deltas.pace = -1
      deltas.stamina = -1
      deltas.vision = 1
      deltas.composure = 1
      ovrDelta = Math.random() > 0.6 ? 0 : -1
    } else {
      // Declive natural (34+ años)
      let physicalLoss = -2
      if (newAge >= 36) physicalLoss = -3

      // Regla 28.2: El escudo del profesionalismo amortigua 50%
      if (professionalism >= 16) {
        physicalLoss = Math.round(physicalLoss * 0.5)
      }

      deltas.pace = physicalLoss
      deltas.stamina = physicalLoss
      deltas.composure = 1
      ovrDelta = Math.min(-1, physicalLoss + 1)

      // Regla 28.4: Evaluación de retiro voluntario
      if (newAge >= 37 || (newAge >= 34 && (currentOvr + ovrDelta) < 46)) {
        retiring = true
      } else if (newAge >= 35 && Math.random() < 0.40) {
        retiring = true
      }

      if (retiring) {
        const roles = ['COACH', 'SCOUT', 'PHYSIO', 'LEAVE_FOOTBALL']
        futureRole = roles[Math.floor(Math.random() * roles.length)]
      }
    }

    // Regla 28.3: Techo Infranqueable de Potencial
    let newOvr = currentOvr + ovrDelta
    if (newOvr > potential) {
      newOvr = potential
    }
    newOvr = Math.max(30, Math.min(99, newOvr))

    const careerPhase = this.determineCareerPhase(newAge, retiring)

    return {
      newAge,
      ovrBefore: currentOvr,
      ovrAfter: newOvr,
      ovrDelta: newOvr - currentOvr,
      attributesDelta: deltas,
      careerPhase,
      retiring,
      futureRole,
      minutesPlayed: minutes
    }
  },

  /**
   * Procesa en lote la evolución anual del plantel de un club.
   * Se puede retomar: los futbolistas que ya tienen su registro de esa temporada se saltean, así que si el cierre se interrumpe
   * nadie envejece dos veces ni se vuelve a sortear su evolución. Un error de la base corta el proceso (no se ignora).
   */
  async processAnnualEvolution(clubId, seasonYear) {
    if (!clubId || !seasonYear) throw new Error('Parámetros de club y año requeridos')

    // 1. Obtener futbolistas del club
    const { data: allSquad, error: squadErr } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
    if (squadErr) throw new Error(squadErr.message)

    // Los que ya evolucionaron en este cierre (si se retoma) no se tocan
    const { data: done, error: doneErr } = await supabase
      .from('player_evolution_history')
      .select('player_id')
      .eq('club_id', clubId)
      .eq('season_year', seasonYear)
    if (doneErr) throw new Error(doneErr.message)
    const already = new Set((done || []).map(r => r.player_id))
    const squad = (allSquad || []).filter(p => !already.has(p.id))

    if (squad.length === 0) return []

    // 2. Obtener personalidades
    const { data: personalities } = await supabase
      .from('player_personalities')
      .select('*')
      .in('player_id', squad.map(p => p.id))

    const persMap = new Map((personalities || []).map(p => [p.player_id, p]))
    const evolutionResults = []

    for (const player of squad) {
      const pers = persMap.get(player.id)
      const evo = this.calculateAnnualEvolution(player, pers)

      // 3. Registrar en player_evolution_history (idempotente)
      const { error: histErr } = await supabase
        .from('player_evolution_history')
        .upsert({
          player_id: player.id,
          club_id: clubId,
          season_year: seasonYear,
          age_at_season: evo.newAge,
          ovr_before: evo.ovrBefore,
          ovr_after: evo.ovrAfter,
          attributes_delta: evo.attributesDelta,
          minutes_played: evo.minutesPlayed
        }, { onConflict: 'player_id,season_year' })
      if (histErr) throw new Error(histErr.message)

      // 4. Registrar retiro si aplica
      if (evo.retiring) {
        const { error: retErr } = await supabase
          .from('player_retirements')
          .upsert({
            player_id: player.id,
            club_id: clubId,
            announcement_week: 52,
            planned_retirement_season: seasonYear + 1,
            future_role_interest: evo.futureRole
          }, { onConflict: 'player_id' })
        if (retErr) throw new Error(retErr.message)
      }

      // 5. Actualizar ficha del futbolista
      const { error: updErr } = await supabase
        .from('players')
        .update({
          age: evo.newAge,
          // `overall` es una columna calculada a partir de los atributos: la base no deja escribirla (hacerlo cortaba todo el cierre)
          attr_overall: evo.ovrAfter,
          career_phase: evo.careerPhase,
          minutes_played_season: 0, // Reset anual de minutos
          announced_retirement_year: evo.retiring ? seasonYear + 1 : null
        })
        .eq('id', player.id)
      if (updErr) throw new Error(updErr.message)

      evolutionResults.push({
        player,
        evolution: evo
      })
    }

    queryCache.invalidate(`squad:${clubId}`)
    queryCache.invalidate(`evolution:${clubId}:${seasonYear}`)
    queryCache.invalidate(`retirements:${clubId}`)

    return evolutionResults
  },

  /**
   * Cuántos futbolistas evolucionaron en la temporada y cuántos anunciaron su retiro: sirve para el registro del cierre
   * aunque el proceso se haya hecho en varios intentos.
   */
  async countSeasonEvolution(clubId, seasonYear) {
    const [aged, retiring] = await Promise.all([
      supabase.from('player_evolution_history').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('season_year', seasonYear),
      supabase.from('player_retirements').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('planned_retirement_season', seasonYear + 1)
    ])
    return { aged: aged.count || 0, retiring: retiring.count || 0 }
  },

  /**
   * Obtiene el reporte de evolución de la última temporada para el club
   */
  async getClubEvolutionHistory(clubId, seasonYear) {
    if (!clubId) return []

    const cached = queryCache.get(`evolution:${clubId}:${seasonYear}`)
    if (cached) return cached

    const { data, error } = await supabase
      .from('player_evolution_history')
      .select(`
        *,
        players:player_id (
          id,
          first_name,
          last_name,
          position,
          age,
          number:shirt_number,
          overall,
          potential_rating:attr_potential,
          career_phase,
          minutes_played_season
        )
      `)
      .eq('club_id', clubId)
      .eq('season_year', seasonYear)
      .order('ovr_after', { ascending: false })

    if (error) {
      console.error('Error fetching evolution history:', error)
      return []
    }

    queryCache.set(`evolution:${clubId}:${seasonYear}`, data, 30000)
    return data || []
  },

  /**
   * Obtiene los futbolistas que han anunciado su retiro próximo
   */
  async getRetiringPlayers(clubId) {
    if (!clubId) return []

    const cached = queryCache.get(`retirements:${clubId}`)
    if (cached) return cached

    const { data, error } = await supabase
      .from('player_retirements')
      .select(`
        *,
        players:player_id (
          id,
          first_name,
          last_name,
          position,
          age,
          overall,
          number:shirt_number
        )
      `)
      .eq('club_id', clubId)

    if (error) {
      console.error('Error fetching retiring players:', error)
      return []
    }

    queryCache.set(`retirements:${clubId}`, data, 30000)
    return data || []
  },

  /**
   * Incrementa los minutos jugados por un futbolista en partido oficial
   */
  async trackMatchMinutes(playerId, minutes = 90) {
    if (!playerId) return

    const { data: p } = await supabase
      .from('players')
      .select('minutes_played_season')
      .eq('id', playerId)
      .single()

    const currentMinutes = p?.minutes_played_season || 0
    await supabase
      .from('players')
      .update({ minutes_played_season: currentMinutes + minutes })
      .eq('id', playerId)
  }
}
