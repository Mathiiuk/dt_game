import { supabase } from './supabase'
import { positionLine, normalizePosition } from '../domain/positions'
import { homeAdvantage } from '../domain/consequences'
import { SUSPENSION_POWER_FACTOR } from '../domain/barra'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const SHOUT_TYPES = [
  { 
    id: 'SHOUT_FOCUS', 
    label: '¡Más garra y concentración!', 
    desc: '+15% defensa durante 15 minutos.',
    effect: { defBuff: 1.15, attBuff: 1.0 }
  },
  { 
    id: 'SHOUT_CALM', 
    label: '¡Cálmense, toquen la pelota!', 
    desc: '+15% posesión y +5% en ataque y defensa durante 15 minutos.',
    effect: { defBuff: 1.05, attBuff: 1.05, posBuff: 1.15 }
  },
  { 
    id: 'SHOUT_ATTACK', 
    label: '¡Todos al ataque!', 
    desc: '+20% ataque y -15% defensa durante 15 minutos.',
    effect: { attBuff: 1.20, defBuff: 0.85 }
  },
  { 
    id: 'SHOUT_LOCK', 
    label: '¡Aseguren el resultado!', 
    desc: '+25% defensa y -30% ataque durante 15 minutos.',
    effect: { defBuff: 1.25, attBuff: 0.70 }
  }
]

/**
 * Aporte de cada puesto a ataque, defensa y mediocampo (0 a 1). Un equipo se pesa por lo que rinde cada uno EN su puesto
 * (`slot_rating`): un arquero de delantero casi no suma al ataque y deja un hueco en el arco.
 */
export const SLOT_POWER_WEIGHTS = {
  PO:  { attack: 0.00, defense: 1.10, midfield: 0.00 },
  DFC: { attack: 0.05, defense: 1.00, midfield: 0.10 },
  LI:  { attack: 0.20, defense: 0.70, midfield: 0.20 },
  LD:  { attack: 0.20, defense: 0.70, midfield: 0.20 },
  MCD: { attack: 0.15, defense: 0.90, midfield: 0.80 },
  MC:  { attack: 0.35, defense: 0.40, midfield: 1.00 },
  MCO: { attack: 0.80, defense: 0.10, midfield: 0.80 },
  MI:  { attack: 0.50, defense: 0.20, midfield: 0.60 },
  MD:  { attack: 0.50, defense: 0.20, midfield: 0.60 },
  EI:  { attack: 0.90, defense: 0.05, midfield: 0.20 },
  ED:  { attack: 0.90, defense: 0.05, midfield: 0.20 },
  DC:  { attack: 1.00, defense: 0.05, midfield: 0.10 }
}

/** Poder del equipo a partir de la media de cada titular en su puesto (escala de las medias, 50 a 99) */
export const slotBasedPower = (players) => {
  const total = { attack: 0, defense: 0, midfield: 0 }
  const weight = { attack: 0, defense: 0, midfield: 0 }
  for (const p of players) {
    const w = SLOT_POWER_WEIGHTS[normalizePosition(p.slot_base || p.position)]
    for (const k of ['attack', 'defense', 'midfield']) {
      total[k] += w[k] * p.slot_rating
      weight[k] += w[k]
    }
  }
  const avg = (k) => (weight[k] > 0 ? total[k] / weight[k] : 40)
  return { attack: avg('attack'), defense: avg('defense'), midfield: avg('midfield') }
}

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
export const simulateMatch = (homeTactic, homePlayers = [], awayTactic, awayPlayers = [], seed = 'default-seed', { homeAdvantage = 1.08, homePowerFactor = 1, awayPowerFactor = 1, changes = [] } = {}) => {
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

    // Con puestos asignados (`slot_rating`) se pesa cada uno por lo que rinde en su lugar: jugar fuera de posición cuesta
    if (list.every(p => typeof p.slot_rating === 'number')) {
      const power = slotBasedPower(list)
      return {
        fitness: baseFitness,
        attack: power.attack,
        defense: power.defense * 0.8 + baseFitness * 0.2,
        midfield: power.midfield * 0.6 + baseFitness * 0.4,
        players: list
      }
    }

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
      attack *= homeAdvantage
      defense *= homeAdvantage
      midfield *= homeAdvantage
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

  // Con el DT suspendido dirige el ayudante y el equipo rinde menos
  const withFactor = (team, factor) => {
    if (factor !== 1) {
      team.attack *= factor
      team.defense *= factor
      team.midfield *= factor
    }
    return team
  }
  const homeTeam = withFactor(applyTactics(homeBase, homeTactic, awayTactic, true), homePowerFactor)
  const awayTeam = withFactor(applyTactics(awayBase, awayTactic, homeTactic, false), awayPowerFactor)

  // Estado de partido de cada lado: efectos activos (gritos y decisiones), expulsados y jugadores con molestias
  for (const team of [homeTeam, awayTeam]) Object.assign(team, { buffs: [], reds: 0, redIds: new Set(), hurtIds: new Set(), midAcc: 0 })
  const buffOf = (team, min, key) => team.buffs.reduce((acc, b) => (min <= b.until ? acc * b[key] : acc), 1)
  // Un expulsado deja al equipo con diez (-8%) y quien sigue jugando con molestias rinde menos (-4% cada uno, hasta dos)
  const situation = (team) => 0.92 ** team.reds * 0.96 ** Math.min(2, team.players.filter(p => p.id && team.hurtIds.has(p.id)).length)

  // Cambios del DT en vivo: desde el minuto siguiente rinde el nuevo once (los que entran llegan frescos, los demás ya corrieron)
  const applyChange = (change, min) => {
    const isHomeSide = change.team === 'home'
    const team = isHomeSide ? homeTeam : awayTeam
    // Gritos y decisiones: un efecto sobre ataque, defensa y mediocampo que dura `duration` minutos
    if (!change.players) {
      const { att = 1, def = 1, mid = 1 } = change.buff || {}
      team.buffs.push({ att, def, mid, until: change.minute + (change.duration || 15) })
      return
    }
    const stayed = new Set(team.players.map(p => p.id))
    const next = withFactor(
      applyTactics(calcBasePower(change.players), isHomeSide ? homeTactic : awayTactic, isHomeSide ? awayTactic : homeTactic, isHomeSide),
      isHomeSide ? homePowerFactor : awayPowerFactor
    )
    const ran = team.fitnessDrain * (min - 1)
    const fitness = change.players.reduce((acc, p) => acc + (stayed.has(p.id) ? Math.max(0, (p.state_fitness || 75) - ran) : (p.state_fitness || 75)), 0) / change.players.length
    const stillOn = next.players.filter(p => !(p.id && team.redIds.has(p.id)))
    Object.assign(team, { attack: next.attack, defense: next.defense, midfield: next.midfield, players: stillOn, fitness })
  }

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

  // La línea en la que juega cada uno (por su puesto en la cancha si lo tiene, si no por su posición natural)
  const lineOf = (p) => positionLine(p.slot_base || p.position)
  const getRandomPlayer = (teamList, preferredRole = null) => {
    if (!teamList || teamList.length === 0) return { first_name: 'Futbolista', last_name: '' }
    const pick = (line) => {
      const list = teamList.filter(p => lineOf(p) === line)
      return list.length > 0 ? list[Math.floor(rng() * list.length)] : null
    }
    if (preferredRole === 'ATTACK') {
      const found = pick('DEL')
      if (found) return found
    } else if (preferredRole === 'MID') {
      const found = pick('MED')
      if (found) return found
    } else if (preferredRole === 'DEF') {
      const found = pick('DEF')
      if (found) return found
    } else if (preferredRole === 'GK') {
      const gks = teamList.filter(p => lineOf(p) === 'ARQ')
      if (gks.length > 0) return gks[0]
    }
    return teamList[Math.floor(rng() * teamList.length)]
  }

  // 3. Simular los 90 minutos
  for (let min = 1; min <= 90; min++) {
    for (const change of changes) if (change.minute + 1 === min) applyChange(change, min)
    homeTeam.fitness = Math.max(0, homeTeam.fitness - homeTeam.fitnessDrain)
    awayTeam.fitness = Math.max(0, awayTeam.fitness - awayTeam.fitnessDrain)

    const homeSit = situation(homeTeam)
    const awaySit = situation(awayTeam)
    const curHomeAtt = homeTeam.attack * (0.6 + (homeTeam.fitness / 250)) * buffOf(homeTeam, min, 'att') * homeSit
    const curHomeDef = homeTeam.defense * (0.6 + (homeTeam.fitness / 250)) * buffOf(homeTeam, min, 'def') * homeSit
    const curAwayAtt = awayTeam.attack * (0.6 + (awayTeam.fitness / 250)) * buffOf(awayTeam, min, 'att') * awaySit
    const curAwayDef = awayTeam.defense * (0.6 + (awayTeam.fitness / 250)) * buffOf(awayTeam, min, 'def') * awaySit
    homeTeam.midAcc += homeTeam.midfield * buffOf(homeTeam, min, 'mid') * homeSit
    awayTeam.midAcc += awayTeam.midfield * buffOf(awayTeam, min, 'mid') * awaySit

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

      const goalChance = Math.max(0.06, Math.min(0.42, ((isHome ? curHomeAtt : curAwayAtt) / ((isHome ? curHomeAtt : curAwayAtt) + (isHome ? curAwayDef : curHomeDef))) * 0.40))
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
        foulTeam.reds++
        if (playerFoul.id) {
          foulTeam.redIds.add(playerFoul.id)
          if (foulTeam.players.length > 8) foulTeam.players = foulTeam.players.filter(p => p.id !== playerFoul.id)
        }
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
      if (injuredPlayer.id) injTeam.hurtIds.add(injuredPlayer.id)
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
  const totalPowerMid = homeTeam.midAcc + awayTeam.midAcc
  const homePossession = Math.round((homeTeam.midAcc / totalPowerMid) * 100)
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
  async startMatch(fixtureId, userClubId, homeTactic, homePlayers, awayTactic, awayPlayers, seed = null, { userPowerFactor = 1, userIsHome = null } = {}) {
    const finalSeed = seed || `seed_${Date.now()}_${Math.random()}`
    // La caldera pesa: la ventaja de local sale del humor de la hinchada local (1,02 hostil a 1,10 caldera)
    let homeAdvantageFactor = 1.08
    let homePowerFactor = 1
    let awayPowerFactor = 1
    if (fixtureId) {
      try {
        const { data: fx } = await supabase.from('fixtures').select('home_club_id').eq('id', fixtureId).maybeSingle()
        if (fx?.home_club_id) {
          const { data: fans } = await supabase.from('club_fanbase').select('fan_support_score').eq('club_id', fx.home_club_id).maybeSingle()
          if (fans?.fan_support_score != null) homeAdvantageFactor = homeAdvantage(fans.fan_support_score)
        }

        // Suspensión del DT por un escándalo: este partido lo dirige el ayudante
        const { data: climate } = await supabase.from('club_climate').select('suspended_matches').eq('club_id', userClubId).maybeSingle()
        if ((climate?.suspended_matches || 0) > 0) {
          if (fx?.home_club_id === userClubId) homePowerFactor = SUSPENSION_POWER_FACTOR
          else awayPowerFactor = SUSPENSION_POWER_FACTOR
          await supabase.from('club_climate').update({ suspended_matches: climate.suspended_matches - 1 }).eq('club_id', userClubId)
        }
      } catch {
        // Sin dato de hinchada ni de suspensión se mantiene la ventaja base
      }
    }
    // Química del once del DT (de -3% a +3%): mejora o empeora el rendimiento de su lado
    if (userPowerFactor !== 1 && userIsHome !== null) {
      if (userIsHome) homePowerFactor *= userPowerFactor
      else awayPowerFactor *= userPowerFactor
    }
    const options = { homeAdvantage: homeAdvantageFactor, homePowerFactor, awayPowerFactor }
    const simResults = simulateMatch(homeTactic, homePlayers, awayTactic, awayPlayers, finalSeed, options)

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
      ...simResults,
      // Todo lo necesario para volver a jugar el resto del partido si el DT hace cambios
      inputs: { homeTactic, homePlayers, awayTactic, awayPlayers, options }
    }
  },

  /**
   * Rejuega el partido con los cambios del DT. Es el mismo partido (misma semilla): hasta el minuto del cambio todo queda igual,
   * y desde el siguiente rinde el nuevo once.
   */
  replayWithChanges(results, changes) {
    const { homeTactic, homePlayers, awayTactic, awayPlayers, options } = results.inputs
    const next = simulateMatch(homeTactic, homePlayers, awayTactic, awayPlayers, results.seed, { ...options, changes })
    return { ...results, ...next }
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
        // El resultado y la tabla los cierra la base: valida que el partido sea tuyo, esté abierto, ya haya llegado su fecha
        // y el marcador sea razonable (la simulación en vivo sigue en el navegador)
        const { error: finishErr } = await supabase.rpc('finish_user_fixture', {
          p_fixture_id: fixtureId, p_user_club_id: clubId, p_home: homeScore, p_away: awayScore
        })
        if (finishErr) throw new Error(finishErr.message)

        // Registrar eventos en match_events
        const keyEvents = events.filter(e => ['GOAL', 'CARD_RED', 'CARD_YELLOW'].includes(e.type))
        if (keyEvents.length > 0) {
          // Los rivales simulados usan ids sintéticos ('rival_1'): sólo se persisten ids reales (uuid)
          const asUuid = (id) => (typeof id === 'string' && UUID_RE.test(id) ? id : null)
          const rows = keyEvents.map(e => ({
            fixture_id: fixtureId,
            minute: e.minute,
            event_type: e.type,
            player_id: asUuid(e.playerId),
            assist_player_id: asUuid(e.assistId),
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
