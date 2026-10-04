import { supabase } from './supabase'

export const SHOUT_TYPES = [
  { 
    id: 'SHOUT_FOCUS', 
    label: '¡Más garra y concentración!', 
    desc: '+15% intensidad defensiva y concentración.',
    effect: { defBuff: 1.15, attBuff: 1.0 }
  },
  { 
    id: 'SHOUT_CALM', 
    label: '¡Cálmense, toquen la pelota!', 
    desc: '+15% posesión y control, reduce riesgo de tarjetas.',
    effect: { defBuff: 1.05, attBuff: 1.05, posBuff: 1.15 }
  },
  { 
    id: 'SHOUT_ATTACK', 
    label: '¡Todos al ataque!', 
    desc: '+20% presencia ofensiva, expone contragolpes.',
    effect: { attBuff: 1.20, defBuff: 0.85 }
  },
  { 
    id: 'SHOUT_LOCK', 
    label: '¡Aseguren el resultado!', 
    desc: 'Repliegue táctico bajo y contención de balón.',
    effect: { defBuff: 1.25, attBuff: 0.70 }
  }
]

// Generador pseudoaleatorio determinista (Mulberry32)
export function createRNG(seedValue) {
  let s = typeof seedValue === 'number' ? seedValue : 123456789
  if (typeof seedValue === 'string') {
    s = 0
    for (let i = 0; i < seedValue.length; i++) {
      s = (s * 31 + seedValue.charCodeAt(i)) >>> 0
    }
  }
  return function() {
    let t = (s += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Simulación autoritativa minuto a minuto con semilla reproducible.
 */
export const simulateMatch = (homeTactic, homePlayers = [], awayTactic, awayPlayers = [], seed = 'default-seed') => {
  const rng = createRNG(seed)

  // 1. Calcular poder base de cada equipo
  const calcBasePower = (players) => {
    const list = players.length > 0 ? players : Array.from({ length: 11 }).map((_, i) => ({
      first_name: 'Jugador',
      last_name: `#${i + 1}`,
      state_fitness: 85,
      attr_pace: 50,
      attr_shooting: 50,
      attr_passing: 50,
      attr_defending: 50
    }))

    const baseFitness = list.reduce((acc, p) => acc + (p.state_fitness || 75), 0) / list.length
    const basePace = list.reduce((acc, p) => acc + (p.attr_pace || 50), 0) / list.length
    const baseShooting = list.reduce((acc, p) => acc + (p.attr_shooting || 50), 0) / list.length
    const baseDefending = list.reduce((acc, p) => acc + (p.attr_defending || 50), 0) / list.length
    const basePassing = list.reduce((acc, p) => acc + (p.attr_passing || 50), 0) / list.length

    return {
      fitness: baseFitness,
      attack: basePace * 0.35 + baseShooting * 0.45 + basePassing * 0.2,
      defense: basePace * 0.25 + baseDefending * 0.55 + baseFitness * 0.2,
      midfield: basePassing * 0.6 + baseFitness * 0.4,
      players: list
    }
  }

  const homeBase = calcBasePower(homePlayers)
  const awayBase = calcBasePower(awayPlayers)

  // 2. Modificadores tácticos
  const applyTactics = (base, myTactic = {}, oppTactic = {}, isHome = false) => {
    let attack = base.attack
    let defense = base.defense
    let midfield = base.midfield

    if (myTactic.mentality === 'Ofensiva' || myTactic.mentality === 'ATTACKING') {
      attack *= 1.20
      defense *= 0.85
    } else if (myTactic.mentality === 'Defensiva' || myTactic.mentality === 'DEFENSIVE') {
      attack *= 0.80
      defense *= 1.20
    } else if (myTactic.mentality === 'ALL_OUT_ATTACK') {
      attack *= 1.35
      defense *= 0.70
    }

    if (isHome) {
      attack *= 1.08
      defense *= 1.08
      midfield *= 1.08
    }

    let fitnessDrain = 0.35
    if (myTactic.tempo === 'Alto' || myTactic.tempo === 'FAST') {
      attack *= 1.12
      fitnessDrain = 0.55
    } else if (myTactic.tempo === 'Lento' || myTactic.tempo === 'SLOW') {
      defense *= 1.08
      fitnessDrain = 0.22
    }

    return {
      attack,
      defense,
      midfield,
      fitnessDrain,
      fitness: base.fitness,
      players: base.players
    }
  }

  const homeTeam = applyTactics(homeBase, homeTactic, awayTactic, true)
  const awayTeam = applyTactics(awayBase, awayTactic, homeTactic, false)

  const events = []
  let homeScore = 0
  let awayScore = 0

  let homeShots = 0
  let awayShots = 0
  let homeShotsOnTarget = 0
  let awayShotsOnTarget = 0
  let homeFouls = 0
  let awayFouls = 0
  let homeYellows = 0
  let awayYellows = 0
  let homeCorners = 0
  let awayCorners = 0

  const getRandomPlayer = (teamList, preferredRole = null) => {
    if (!teamList || teamList.length === 0) return { first_name: 'Futbolista', last_name: '' }
    if (preferredRole === 'ATTACK') {
      const attackers = teamList.filter(p => ['ST', 'CF', 'LW', 'RW', 'DEL'].includes(p.position))
      if (attackers.length > 0) return attackers[Math.floor(rng() * attackers.length)]
    } else if (preferredRole === 'MID') {
      const mids = teamList.filter(p => ['CM', 'CAM', 'CDM', 'LM', 'RM', 'MED'].includes(p.position))
      if (mids.length > 0) return mids[Math.floor(rng() * mids.length)]
    } else if (preferredRole === 'DEF') {
      const defs = teamList.filter(p => ['CB', 'LB', 'RB', 'DEF'].includes(p.position))
      if (defs.length > 0) return defs[Math.floor(rng() * defs.length)]
    } else if (preferredRole === 'GK') {
      const gks = teamList.filter(p => p.position === 'GK')
      if (gks.length > 0) return gks[0]
    }
    return teamList[Math.floor(rng() * teamList.length)]
  }

  // 3. Simular los 90 minutos
  for (let min = 1; min <= 90; min++) {
    homeTeam.fitness = Math.max(0, homeTeam.fitness - homeTeam.fitnessDrain)
    awayTeam.fitness = Math.max(0, awayTeam.fitness - awayTeam.fitnessDrain)

    const curHomeAtt = homeTeam.attack * (0.6 + (homeTeam.fitness / 250))
    const curHomeDef = homeTeam.defense * (0.6 + (homeTeam.fitness / 250))
    const curAwayAtt = awayTeam.attack * (0.6 + (awayTeam.fitness / 250))
    const curAwayDef = awayTeam.defense * (0.6 + (awayTeam.fitness / 250))

    const roll = rng()

    // Ocasión de ataque (11% por minuto)
    if (roll < 0.11) {
      const totalPower = curHomeAtt + curAwayAtt
      const isHome = rng() < (curHomeAtt / totalPower)
      const teamId = isHome ? 'home' : 'away'
      const attTeam = isHome ? homeTeam : awayTeam
      const defTeam = isHome ? awayTeam : homeTeam

      const attacker = getRandomPlayer(attTeam.players, 'ATTACK')
      const assister = getRandomPlayer(attTeam.players, 'MID')
      const goalkeeper = getRandomPlayer(defTeam.players, 'GK')

      if (isHome) homeShots++
      else awayShots++

      const goalChance = Math.max(0.06, Math.min(0.42, (curHomeAtt / (curHomeAtt + curAwayDef)) * 0.40))
      const shotRoll = rng()

      if (shotRoll < goalChance) {
        // GOL!
        if (isHome) {
          homeScore++
          homeShotsOnTarget++
        } else {
          awayScore++
          awayShotsOnTarget++
        }

        const assistText = assister && assister.id !== attacker.id ? ` tras asistencia de ${assister.first_name} ${assister.last_name}` : ''
        events.push({
          minute: min,
          type: 'GOAL',
          team: teamId,
          playerId: attacker.id,
          assistId: assister?.id,
          text: `¡GOL DE ${isHome ? 'LOCAL' : 'VISITA'}! Golazo de ${attacker.first_name} ${attacker.last_name}${assistText}.`
        })
      } else if (shotRoll < goalChance + 0.35) {
        // Atajada
        if (isHome) homeShotsOnTarget++
        else awayShotsOnTarget++

        events.push({
          minute: min,
          type: 'SAVE',
          team: teamId,
          text: `¡Gran atajada de ${goalkeeper.first_name} ${goalkeeper.last_name}! Evita el remate de ${attacker.first_name} ${attacker.last_name}.`
        })
      } else if (shotRoll < goalChance + 0.50) {
        // Tiro de esquina
        if (isHome) homeCorners++
        else awayCorners++

        events.push({
          minute: min,
          type: 'CORNER',
          team: teamId,
          text: `Tiro de esquina para ${isHome ? 'los locales' : 'la visita'}. Centro peligroso al área.`
        })
      } else {
        // Tiro desviado
        events.push({
          minute: min,
          type: 'MISS',
          team: teamId,
          text: `Disparo potente de ${attacker.first_name} ${attacker.last_name} que se va apenas desviado por el poste.`
        })
      }
    }

    // Faltas y amonestaciones (4% por minuto)
    if (rng() < 0.04) {
      const isHomeFoul = rng() < 0.5
      const foulTeam = isHomeFoul ? homeTeam : awayTeam
      const playerFoul = getRandomPlayer(foulTeam.players, 'DEF')

      if (isHomeFoul) homeFouls++
      else awayFouls++

      const cardRoll = rng()
      if (cardRoll < 0.03) {
        // ROJA directa
        if (isHomeFoul) homeYellows++
        else awayYellows++

        events.push({
          minute: min,
          type: 'CARD_RED',
          team: isHomeFoul ? 'home' : 'away',
          playerId: playerFoul.id,
          text: `¡TARJETA ROJA! Expulsado ${playerFoul.first_name} ${playerFoul.last_name} por una falta temeraria.`
        })
      } else if (cardRoll < 0.28) {
        // Amarilla
        if (isHomeFoul) homeYellows++
        else awayYellows++

        events.push({
          minute: min,
          type: 'CARD_YELLOW',
          team: isHomeFoul ? 'home' : 'away',
          playerId: playerFoul.id,
          text: `Amonestado ${playerFoul.first_name} ${playerFoul.last_name} tras cometer falta táctica en la mitad de la cancha.`
        })
      }
    }

    // Lesiones imprevistas en partido (0.8% por minuto)
    if (rng() < 0.008) {
      const isHomeInj = rng() < 0.5
      const injTeam = isHomeInj ? homeTeam : awayTeam
      const injuredPlayer = getRandomPlayer(injTeam.players)

      events.push({
        minute: min,
        type: 'INJURY',
        team: isHomeInj ? 'home' : 'away',
        playerId: injuredPlayer.id,
        text: `Atención médica para ${injuredPlayer.first_name} ${injuredPlayer.last_name}. Presenta molestias físicas.`
      })
    }
  }

  // Pitazo final
  events.push({
    minute: 90,
    type: 'END',
    team: 'none',
    text: '¡Final del partido! El árbitro señala el centro del campo y concluye el encuentro.'
  })

  // Estadísticas consolidadas
  const totalPowerMid = homeTeam.midfield + awayTeam.midfield
  const homePossession = Math.round((homeTeam.midfield / totalPowerMid) * 100)
  const awayPossession = 100 - homePossession

  return {
    homeScore,
    awayScore,
    events,
    stats: {
      possession: { home: homePossession, away: awayPossession },
      shots: { home: homeShots, away: awayShots },
      shotsOnTarget: { home: homeShotsOnTarget, away: awayShotsOnTarget },
      fouls: { home: homeFouls, away: awayFouls },
      yellowCards: { home: homeYellows, away: awayYellows },
      corners: { home: homeCorners, away: awayCorners }
    }
  }
}

export const matchEngineApi = {
  /**
   * Marca el inicio del partido autoritativamente en la base de datos para impedir reinicios a 0'.
   */
  async startMatch(fixtureId, userClubId, homeTactic, homePlayers, awayTactic, awayPlayers, seed = null) {
    const finalSeed = seed || `seed_${Date.now()}_${Math.random()}`
    const simResults = simulateMatch(homeTactic, homePlayers, awayTactic, awayPlayers, finalSeed)

    if (fixtureId) {
      try {
        await supabase
          .from('fixtures')
          .update({
            status: 'IN_PROGRESS',
            current_minute: 0,
            seed: finalSeed,
            started_at: new Date().toISOString()
          })
          .eq('id', fixtureId)
      } catch (err) {
        console.warn('Aviso: no se pudo persistir status IN_PROGRESS en fixtures:', err)
      }
    }

    return {
      seed: finalSeed,
      ...simResults
    }
  },

  /**
   * Guarda de forma inmutable el resultado oficial del partido al pitazo final.
   */
  async finalizeMatch(fixtureId, clubId, isHome, oppName, homeScore, awayScore, events = [], stats = {}) {
    if (!clubId) return false

    // 1. Guardar en match_history local
    try {
      await supabase.from('match_history').insert({
        club_id: clubId,
        opponent_name: oppName || 'Equipo Rival',
        home_score: homeScore,
        away_score: awayScore,
        is_home: isHome,
        match_date: new Date().toISOString().split('T')[0]
      })
    } catch (e) {
      console.warn('Error guardando en match_history:', e)
    }

    // 2. Actualizar fixture oficial de torneo si existe
    if (fixtureId) {
      try {
        await supabase
          .from('fixtures')
          .update({
            status: 'FINISHED',
            home_score: homeScore,
            away_score: awayScore,
            current_minute: 90,
            finished_at: new Date().toISOString()
          })
          .eq('id', fixtureId)

        // Registrar eventos en match_events
        const keyEvents = events.filter(e => ['GOAL', 'CARD_RED', 'CARD_YELLOW'].includes(e.type))
        if (keyEvents.length > 0) {
          const rows = keyEvents.map(e => ({
            fixture_id: fixtureId,
            minute: e.minute,
            event_type: e.type,
            player_id: e.playerId || null,
            assist_player_id: e.assistId || null,
            description: e.text
          }))
          await supabase.from('match_events').insert(rows)
        }
      } catch (err) {
        console.warn('Error actualizando fixture en DB:', err)
      }
    }

    return true
  }
}
