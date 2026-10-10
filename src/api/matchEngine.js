import { supabase } from './supabase'
import { tacticMultipliers } from '../domain/tacticalStyle'
import { positionLine, normalizePosition } from '../domain/positions'
import { specialistsOf, aerialOf } from '../domain/specialists'
import { stylesToMods } from '../domain/rivalStyle'
import { styleQuipFor } from '../domain/rivalNarrative'
import { NOTE_MINUTES, tacticalNote } from '../domain/rivalNotes'
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

/** Remates de humor del relator: se suman al final de la línea del relato (el texto base no cambia) */
const QUIPS = {
  GOAL: ['Se la dedica a la abuela, que no vino pero escucha por la radio.', 'El que vende choripán en la popular dejó todo para gritarlo.', 'Los vecinos de la cuadra creyeron que había temblor.', 'El arquero todavía está buscando la pelota.', 'En la platea, un señor tiró el sándwich al aire.'],
  SAVE: ['El arquero pidió aplausos; se los dieron igual.', 'Ese guante tiene seguro contra todo riesgo.', 'La pelota quedó pidiendo disculpas.', 'Atajó con la cara, pero atajó.'],
  MISS: ['Se la perdió y todavía se pregunta cómo.', 'La pelota se fue a hacerle compañía a las nubes.', 'En el banco alguien se tapó la cara con la campera.', 'Ese se lo comía hasta el utilero.'],
  CORNER: ['El del banderín ya se acomodó el sombrero.', 'En el área se reparten empujones con mucha educación.'],
  YELLOW: ['El árbitro sacó la tarjeta con ganas de cantar bingo.', 'Protestó tanto que casi le dan dos.'],
  RED: ['Se va con la cabeza gacha y el sándwich de la cancha lo espera.', 'El vestuario va a quedar silencioso, y el del rival, con música.'],
  INJURY: ['El de la camilla hizo el trote más largo de su carrera.', 'Se oyó un "ay" que llegó hasta la tribuna visitante.']
}

/**
 * Simulación autoritativa minuto a minuto con semilla reproducible.
 */
export const simulateMatch = (homeTactic, homePlayers = [], awayTactic, awayPlayers = [], seed = 'default-seed', { homeAdvantage = 1.08, homePowerFactor = 1, awayPowerFactor = 1, changes = [], aiSide = null, specialistOverrides = null, styles = null } = {}) => {
  const rng = createRNG(seed)
  // Penales y reacciones del rival tienen su propio azar: no alteran el resto del partido
  const penRng = createRNG(`${seed}:pen`)
  // Personalidad de juego de cada lado (solo el rival la tiene; el lado del DT queda neutro)
  const styleOf = (side) => stylesToMods(styles?.[side])
  // Frase del relato que refleja cómo juega ese lado (en la mitad de las jugadas, para no repetirse); no afecta el resultado
  const styleLine = (side, kind) => {
    const id = styles?.[side]?.id
    if (!id || flavorRng() > 0.5) return ''
    const line = styleQuipFor(id, kind, flavorRng)
    return line ? ` ${line}` : ''
  }
  // Especialistas elegidos a mano por el DT: { home, away } con { rol: idJugador }
  const specOf = (players, side) => specialistsOf(players, specialistOverrides?.[side] || null)
  // Jugadas clave y chistes del relato: también con azar propio, así el resto del partido queda igual
  const kpRng = createRNG(`${seed}:kp`)
  const flavorRng = createRNG(`${seed}:flavor`)
  const quip = (kind) => { const list = QUIPS[kind]; return list[Math.floor(flavorRng() * list.length)] }

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
  const applyTactics = (base, myTactic = {}, _oppTactic = {}, isHome = false) => {
    // Mentalidad, ritmo, presión y estilo de pase: los efectos viven en domain/tacticalStyle (la pantalla de táctica cuenta los mismos)
    const m = tacticMultipliers(myTactic)
    let attack = base.attack * m.attack
    let defense = base.defense * m.defense
    let midfield = base.midfield * m.midfield
    const fitnessDrain = m.fitnessDrain

    if (isHome) {
      attack *= homeAdvantage
      defense *= homeAdvantage
      midfield *= homeAdvantage
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
  // Con el arquero lesionado el golpe es mayor (-12%)
  const situation = (team) => {
    const hurt = team.players.filter(p => p.id && team.hurtIds.has(p.id)).slice(0, 2)
    return 0.92 ** team.reds * hurt.reduce((acc, p) => acc * (positionLine(p.slot_base || p.position) === 'ARQ' ? 0.88 : 0.96), 1)
  }

  // Cambios del DT en vivo: desde el minuto siguiente rinde el nuevo once (los que entran llegan frescos, los demás ya corrieron)
  const applyChange = (change, min) => {
    // `quality` (0 a 1) sale del minijuego de la barra; sin ella (decisiones viejas) se resuelve como siempre
    const qualityOf = (q) => (q === undefined || q === null ? null : Math.max(0, Math.min(1, Number(q))))
    const isHomeSide = change.team === 'home'
    const team = isHomeSide ? homeTeam : awayTeam
    // Penal pendiente: quién lo patea (equipo con el penal) o hacia dónde se tira el arquero (equipo que defiende)
    if (change.kind === 'PENALTY_TAKER') { team.penaltyTaker = change.playerId; return }
    if (change.kind === 'PENALTY_DIVE') { team.penaltyDive = change.dive; return }
    // Penal a favor con puntería: hacia dónde patea y qué tan bien le pegó (0 a 1, del minijuego)
    if (change.kind === 'PENALTY_AIM') { team.penaltyAim = { aim: change.aim, quality: Math.max(0, Math.min(1, Number(change.quality ?? 0.7))) }; return }
    // Jugada clave: lo que decide el DT para el mano a mano (en ataque o en defensa)
    if (change.kind === 'KEYPLAY_CHOICE') { keyChoice = { side: change.team, choice: change.choice, quality: qualityOf(change.quality) }; return }
    // Remate peligroso en contra: qué tan bien reaccionó el arquero (0 a 1, del minijuego)
    // Córner a favor: a qué zona va el centro. Tiro libre a favor: quién lo patea, hacia dónde y qué tan bien le pegó
    if (change.kind === 'SETPIECE_CORNER') { setChoice = { side: change.team, kind: 'CORNER', zone: change.zone, quality: qualityOf(change.quality) }; return }
    // Defender la pelota parada del rival: a qué zona refuerza (o deja dos arriba para la contra) y cómo se ordena ante el tiro libre
    if (change.kind === 'SETPIECE_DEF_CORNER') { setChoice = { side: change.team, kind: 'DEF_CORNER', zone: change.zone, quality: qualityOf(change.quality) }; return }
    if (change.kind === 'SETPIECE_DEF_FK') { setChoice = { side: change.team, kind: 'DEF_FK', mode: change.mode }; return }
    if (change.kind === 'SETPIECE_FK') { setChoice = { side: change.team, kind: 'FK', taker: change.playerId, aim: change.aim, quality: Math.max(0, Math.min(1, Number(change.quality ?? 0.6))) }; return }
    if (change.kind === 'SAVE_REACT') { saveReact = { side: change.team, quality: Math.max(0, Math.min(1, Number(change.quality ?? 0.5))) }; return }
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

  // Penal anunciado a la espera de que se patee (se resuelve al minuto siguiente, después de las decisiones del DT)
  let pendingPenalty = null
  // Jugada clave anunciada (mano a mano) a la espera de lo que decida el DT; se resuelve al minuto siguiente
  let pendingKeyPlay = null
  let keyChoice = null
  // Remate peligroso anunciado (la jugada se resuelve al minuto siguiente) y la reacción del arquero del DT
  let pendingShot = null
  let saveReact = null
  // Pelota parada (córner o tiro libre) anunciada, y lo que decidió el DT para cobrarla
  let pendingSet = null
  let setChoice = null
  const penaltyText = (team) => (team === 'home' ? 'el local' : 'la visita')

  // Resolución de una ocasión de gol: gol, atajada, córner o disparo desviado.
  // `goalChance` ya viene ajustada (por ejemplo por la reacción del arquero).
  const resolveShot = ({ min, isHome, teamId, attacker, assister, goalkeeper, goalChance, shotRoll, saveBonus = 0 }) => {
    if (isHome) homeShots++
    else awayShots++
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
        text: `¡GOL DE ${isHome ? 'LOCAL' : 'VISITA'}! Golazo de ${attacker.first_name} ${attacker.last_name}${assistText}. ${quip('GOAL')}${styleLine(teamId, 'GOAL')}`
      })
    } else if (shotRoll < goalChance + 0.35 + saveBonus) {
      // Atajada
      if (isHome) homeShotsOnTarget++
      else awayShotsOnTarget++

      events.push({
        minute: min,
        type: 'SAVE',
        team: teamId,
        text: `¡Gran atajada de ${goalkeeper.first_name} ${goalkeeper.last_name}! Evita el remate de ${attacker.first_name} ${attacker.last_name}. ${quip('SAVE')}${styleLine(teamId, 'SAVE')}`
      })
    } else if (shotRoll < goalChance + 0.35 + 0.15 * styleOf(teamId).corner + saveBonus) {
      // Tiro de esquina
      if (isHome) homeCorners++
      else awayCorners++

      events.push({
        minute: min,
        type: 'CORNER',
        team: teamId,
        text: `Tiro de esquina para ${isHome ? 'los locales' : 'la visita'}. Centro peligroso al área. ${quip('CORNER')}${styleLine(teamId, 'CORNER')}`
      })
      if (!pendingSet && min < 90 && kpRng() < 0.6) {
        const ZONES = ['NEAR', 'MID', 'FAR']
        const weak = ZONES[Math.floor(kpRng() * 3)]
        // La pista del banco acierta casi siempre (7 de cada 10); a veces confunde
        const hint = kpRng() < 0.7 ? weak : ZONES[Math.floor(kpRng() * 3)]
        const target = ZONES[Math.floor(kpRng() * 3)]
        const defHint = kpRng() < 0.7 ? target : ZONES[Math.floor(kpRng() * 3)]
        const sp = specOf((isHome ? homeTeam : awayTeam).players, isHome ? 'home' : 'away')
        pendingSet = { kind: 'CORNER', team: teamId, minute: min + 1, weak, target }
        events.push({ minute: min, type: 'SETPIECE_CORNER', team: teamId, hint, defHint, takerName: sp.CORNER?.name || null, headerName: sp.HEADER?.name || null, text: `Se prepara el córner para ${isHome ? 'el local' : 'la visita'}${sp.CORNER ? `: lo cobra ${sp.CORNER.name}` : ''}, todos al área.${styleLine(teamId, 'SETPIECE_CORNER')}` })
      }
    } else {
      // Tiro desviado
      events.push({
        minute: min,
        type: 'MISS',
        team: teamId,
        text: `Disparo potente de ${attacker.first_name} ${attacker.last_name} que se va apenas desviado por el poste. ${quip('MISS')}${styleLine(teamId, 'MISS')}`
      })
    }
  }

  // 3. Simular los 90 minutos
  for (let min = 1; min <= 90; min++) {
    for (const change of changes) if (change.minute + 1 === min) applyChange(change, min)

    // Nota sobre cómo juega el rival (según su personalidad y el marcador), a los 20, 65 y 80 minutos
    if (NOTE_MINUTES.includes(min)) {
      for (const side of ['home', 'away']) {
        const styleId = styles?.[side]?.id
        if (!styleId) continue
        const note = tacticalNote(styleId, min, side === 'home' ? homeScore : awayScore, side === 'home' ? awayScore : homeScore)
        if (note) events.push({ minute: min, type: 'RIVAL_TACTIC', team: side, text: note })
      }
    }

    // El rival (IA) reacciona al marcador: a los 60 si pierde se tira al ataque y a los 75 si gana se cierra
    if (aiSide && (min === 60 || min === 75)) {
      const aiTeam = aiSide === 'home' ? homeTeam : awayTeam
      const diff = aiSide === 'home' ? homeScore - awayScore : awayScore - homeScore
      if (min === 60 && diff < 0) {
        aiTeam.buffs.push({ att: 1.15, def: 0.9, mid: 1, until: min + 15 })
        events.push({ minute: min, type: 'RIVAL_TACTIC', team: aiSide, text: 'El rival va perdiendo y se tira con todo al ataque: adelanta las líneas.' })
      } else if (min === 75 && diff > 0) {
        aiTeam.buffs.push({ att: 0.9, def: 1.15, mid: 1, until: min + 15 })
        events.push({ minute: min, type: 'RIVAL_TACTIC', team: aiSide, text: 'El rival cuida la ventaja: se repliega y espera para pegar de contra.' })
      }
    }
    homeTeam.fitness = Math.max(0, homeTeam.fitness - homeTeam.fitnessDrain)
    awayTeam.fitness = Math.max(0, awayTeam.fitness - awayTeam.fitnessDrain)

    const homeSit = situation(homeTeam)
    const awaySit = situation(awayTeam)
    const curHomeAtt = homeTeam.attack * (0.6 + (homeTeam.fitness / 250)) * buffOf(homeTeam, min, 'att') * homeSit * styleOf('home').att
    const curHomeDef = homeTeam.defense * (0.6 + (homeTeam.fitness / 250)) * buffOf(homeTeam, min, 'def') * homeSit
    const curAwayAtt = awayTeam.attack * (0.6 + (awayTeam.fitness / 250)) * buffOf(awayTeam, min, 'att') * awaySit * styleOf('away').att
    const curAwayDef = awayTeam.defense * (0.6 + (awayTeam.fitness / 250)) * buffOf(awayTeam, min, 'def') * awaySit
    homeTeam.midAcc += homeTeam.midfield * buffOf(homeTeam, min, 'mid') * homeSit * styleOf('home').mid
    awayTeam.midAcc += awayTeam.midfield * buffOf(awayTeam, min, 'mid') * awaySit * styleOf('away').mid

    // Resolución del penal pendiente: patea el elegido por el DT (o el mejor definidor) y el arquero puede adivinar la esquina
    if (pendingPenalty && pendingPenalty.minute === min) {
      const { team: penTeam } = pendingPenalty
      pendingPenalty = null
      const shooters = penTeam === 'home' ? homeTeam : awayTeam
      const keepers = penTeam === 'home' ? awayTeam : homeTeam
      const skillOf = (p) => p.attr_finishing ?? p.attr_shooting ?? p.attr_overall ?? 50
      const chosen = shooters.players.find(p => p.id && p.id === shooters.penaltyTaker)
      const taker = chosen || specOf(shooters.players, penTeam).PENALTY?.player || [...shooters.players].sort((a, b) => skillOf(b) - skillOf(a))[0] || { first_name: 'Futbolista', last_name: '' }
      const drawn = ['L', 'C', 'R'][Math.floor(penRng() * 3)]
      const aimed = shooters.penaltyAim
      // Con puntería del DT patea adonde apuntó; si no, la esquina se sortea
      const corner = aimed ? aimed.aim : drawn
      let convert = Math.max(0.55, Math.min(0.9, 0.5 + skillOf(taker) / 200))
      if (aimed) {
        // Un buen golpe (barra en la zona verde) sube la chance; uno flojo la baja, y uno malo se va a la tribuna
        convert = aimed.quality < 0.15 ? 0.05 : Math.min(0.95, convert * (0.6 + 0.45 * aimed.quality))
      }
      const dove = keepers.penaltyDive
      // Si el arquero adivina la esquina, casi siempre la ataja (si no lo dirige nadie, el arquero rival adivina por azar)
      if (dove && dove === corner) convert = 0.15
      else if (!dove && aimed && ['L', 'C', 'R'][Math.floor(penRng() * 3)] === corner) convert *= 0.5
      shooters.penaltyTaker = null
      shooters.penaltyAim = null
      keepers.penaltyDive = null
      if (penTeam === 'home') homeShots++
      else awayShots++
      const goes = penRng() < convert
      if (goes) {
        if (penTeam === 'home') { homeScore++; homeShotsOnTarget++ } else { awayScore++; awayShotsOnTarget++ }
        events.push({ minute: min, type: 'GOAL', team: penTeam, playerId: taker.id, text: `¡GOL DE PENAL! ${taker.first_name} ${taker.last_name} la clava ${corner === 'L' ? 'a la izquierda' : corner === 'R' ? 'a la derecha' : 'al medio'}. ${quip('GOAL')}${styleLine(penTeam, 'PENALTY_GOAL')}` })
      } else {
        if (penTeam === 'home') homeShotsOnTarget++
        else awayShotsOnTarget++
        events.push({ minute: min, type: 'MISS', team: penTeam, text: aimed && aimed.quality < 0.15
          ? `¡Penal a la tribuna! ${taker.first_name} ${taker.last_name} le pegó tan mal que la pelota no volvió. ${quip('MISS')}${styleLine(penTeam, 'PENALTY_MISS')}`
          : `¡Penal ${dove === corner ? 'atajado' : 'fallado'}! ${taker.first_name} ${taker.last_name} no pudo. ${quip(dove === corner ? 'SAVE' : 'MISS')}${styleLine(penTeam, 'PENALTY_MISS')}` })
      }
    }
    // Un penal nuevo (poco frecuente): lo pide el equipo que más ataca y se anuncia antes de patearse
    if (min < 90 && penRng() < 0.0035) {
      const toHome = penRng() < (curHomeAtt / (curHomeAtt + curAwayAtt))
      const penTeam = toHome ? 'home' : 'away'
      pendingPenalty = { team: penTeam, minute: min + 1 }
      events.push({ minute: min, type: 'PENALTY', team: penTeam, text: `¡PENAL para ${penaltyText(penTeam)}! El árbitro lo cobra y se arma la polémica.${styleLine(penTeam, 'PENALTY')}` })
    }

    // Resolución de la jugada clave pendiente: el DT eligió cómo jugarla (o la juega el piloto automático)
    if (pendingKeyPlay && pendingKeyPlay.minute === min) {
      const { team: kpTeam } = pendingKeyPlay
      pendingKeyPlay = null
      const kpAtt = kpTeam === 'home' ? homeTeam : awayTeam
      const kpDef = kpTeam === 'home' ? awayTeam : homeTeam
      const attacker = getRandomPlayer(kpAtt.players, 'ATTACK')
      const keeper = getRandomPlayer(kpDef.players, 'GK')
      const attackerName = `${attacker.first_name} ${attacker.last_name}`
      const keeperName = `${keeper.first_name} ${keeper.last_name}`
      const attPower = kpTeam === 'home' ? curHomeAtt : curAwayAtt
      const defPower = kpTeam === 'home' ? curAwayDef : curHomeDef
      const edge = Math.max(0.85, Math.min(1.15, (attPower / (attPower + defPower)) * 2))
      const attacking = keyChoice && keyChoice.side === kpTeam
      const choice = keyChoice ? keyChoice.choice : null
      // Definir bien (barra en el verde) sube la chance; pegarle mal la baja. Sin calidad (decisión vieja) queda igual que antes
      const finish = keyChoice?.quality != null ? 0.7 + 0.6 * keyChoice.quality : 1
      keyChoice = null

      let goalP = 0.32
      let lostBall = false
      let foul = false
      if (attacking && choice === 'DRIBBLE') {
        // Gambeta: si se la saca al arquero, casi seguro es gol; si no, pierde la pelota
        lostBall = kpRng() > 0.55
        goalP = 0.72
      } else if (attacking && choice === 'PASS') {
        goalP = 0.4
      } else if (attacking && choice === 'SHOOT') {
        goalP = 0.34 * finish
      } else if (!attacking && choice === 'OUT') {
        goalP = 0.26
      } else if (!attacking && choice === 'STAY') {
        goalP = 0.34
      } else if (!attacking && choice === 'SLIDE') {
        goalP = 0.2
        foul = kpRng() < 0.2
      }
      goalP = Math.min(0.85, goalP * edge)

      if (kpTeam === 'home') homeShots++
      else awayShots++
      if (lostBall) {
        events.push({ minute: min, type: 'MISS', team: kpTeam, text: `${attackerName} la quiso gambetear y el defensor se la sacó limpia. ${quip('MISS')}` })
      } else if (kpRng() < goalP) {
        if (kpTeam === 'home') { homeScore++; homeShotsOnTarget++ } else { awayScore++; awayShotsOnTarget++ }
        events.push({ minute: min, type: 'GOAL', team: kpTeam, playerId: attacker.id, text: `¡GOL DE ${kpTeam === 'home' ? 'LOCAL' : 'VISITA'}! Golazo de ${attackerName} en el mano a mano. ${quip('GOAL')}` })
      } else {
        if (kpTeam === 'home') homeShotsOnTarget++
        else awayShotsOnTarget++
        events.push({ minute: min, type: 'SAVE', team: kpTeam, text: `¡Tremenda atajada de ${keeperName} en el mano a mano! ${quip('SAVE')}` })
        if (foul) {
          const defTeamIsHome = kpTeam !== 'home'
          if (defTeamIsHome) homeYellows++
          else awayYellows++
          events.push({ minute: min, type: 'CARD_YELLOW', team: defTeamIsHome ? 'home' : 'away', text: 'Se tiró a los pies, no llegó a la pelota y se llevó la amarilla de regalo.' })
        }
      }
    }
    // Resolución del remate peligroso pendiente: si el DT dirigió a su arquero, la reacción cambia la chance de gol
    if (pendingShot && pendingShot.minute === min) {
      const ps = pendingShot
      pendingShot = null
      const defends = saveReact && saveReact.side !== ps.teamId
      const factor = defends ? Math.max(0.4, 1.4 - saveReact.quality) : 1
      saveReact = null
      const adjusted = Math.max(0.03, Math.min(0.6, ps.goalChance * factor))
      // Lo que se le quita al gol se reparte hacia la atajada (y al revés si reaccionó mal)
      resolveShot({ min, isHome: ps.isHome, teamId: ps.teamId, attacker: ps.attacker, assister: ps.assister, goalkeeper: ps.goalkeeper, goalChance: adjusted, shotRoll: ps.shotRoll, saveBonus: ps.goalChance - adjusted })
    }
    // Resolución de la pelota parada pendiente: con la decisión del DT (si es su equipo) o a la suerte
    if (pendingSet && pendingSet.minute === min) {
      const ps = pendingSet
      pendingSet = null
      const mine = setChoice && setChoice.side === ps.team && setChoice.kind === ps.kind ? setChoice : null
      // La decisión de quien defiende (el otro equipo)
      const dmine = setChoice && setChoice.side !== ps.team && setChoice.kind === (ps.kind === 'CORNER' ? 'DEF_CORNER' : 'DEF_FK') ? setChoice : null
      setChoice = null
      const isHomeSet = ps.team === 'home'
      const att = isHomeSet ? homeTeam : awayTeam
      const def = isHomeSet ? awayTeam : homeTeam
      const skill = (p, ...keys) => { for (const k of keys) if (p[k] != null) return p[k]; return p.attr_overall ?? 50 }
      const scoreGoal = (playerId, text) => {
        if (isHomeSet) { homeScore++; homeShotsOnTarget++ } else { awayScore++; awayShotsOnTarget++ }
        events.push({ minute: min, type: 'GOAL', team: ps.team, playerId, text })
      }

      if (ps.kind === 'CORNER') {
        const specialists = specOf(att.players, ps.team)
        const taker = specialists.CORNER?.player || { first_name: 'Futbolista', last_name: '' }
        const header = (specialists.HEADER && kpRng() < 0.6) ? specialists.HEADER.player : getRandomPlayer(att.players, 'ATTACK')
        let chance = 0.09 * (0.85 + skill(taker, 'attr_passing', 'attr_vision') / 333)
        // Si el centro va por donde la defensa está floja, es peligro; si va por donde está fuerte, casi nada
        if (mine) {
          chance *= mine.zone === ps.weak ? 2.1 : 0.8
          // El centro: bien frenada la barra llega al cabezazo; mal frenada se va largo o sale flojo
          if (mine.quality != null) {
            chance *= 0.7 + 0.6 * mine.quality
            if (mine.quality < 0.15) chance = Math.min(chance, 0.02)
          }
        }
        // Quien remata: un buen cabeceador (juego aéreo) vale más que uno flojo
        chance *= 0.8 + aerialOf(header) / 250
        // Quien defiende: reforzar la zona correcta la cierra casi del todo; reforzar otra la deja más expuesta
        // El despeje: con la barra en el verde la zona reforzada la cierra del todo; mal frenada, la cierra mucho menos
        if (dmine && dmine.zone !== 'COUNTER') chance *= dmine.zone === ps.target ? (dmine.quality != null ? 0.45 + 0.4 * (1 - dmine.quality) : 0.45) : 1.1
        if (isHomeSet) homeShots++
        else awayShots++
        if (kpRng() < Math.min(0.5, chance)) {
          scoreGoal(header.id, `¡GOL DE ${isHomeSet ? 'LOCAL' : 'VISITA'}! Golazo de ${header.first_name} ${header.last_name} de cabeza, tras el córner de ${taker.first_name} ${taker.last_name}. ${quip('GOAL')}${styleLine(ps.team, 'GOAL')}`)
        } else {
          events.push({ minute: min, type: 'CLEARED', team: ps.team, text: `El centro de ${taker.first_name} ${taker.last_name} lo despeja la defensa. ${quip('MISS')}${styleLine(ps.team, 'MISS')}` })
          // Con dos hombres esperando arriba, un despeje puede ser el comienzo de un contraataque
          if (dmine && dmine.zone === 'COUNTER' && kpRng() < 0.4) {
            const counterTeam = isHomeSet ? 'away' : 'home'
            const runner = getRandomPlayer(def.players, 'ATTACK')
            const keeperAgainst = getRandomPlayer(att.players, 'GK')
            events.push({ minute: min, type: 'COUNTER', team: counterTeam, text: `¡Contragolpe! ${runner.first_name} ${runner.last_name} se escapa con espacio de sobra.` })
            resolveShot({ min, isHome: !isHomeSet, teamId: counterTeam, attacker: runner, assister: null, goalkeeper: keeperAgainst, goalChance: 0.3, shotRoll: kpRng() })
          }
        }
      } else {
        const taker = (mine && att.players.find(p => p.id && p.id === mine.taker)) || specOf(att.players, ps.team).FREE_KICK?.player || { first_name: 'Futbolista', last_name: '' }
        let chance = 0.07
        let blocked = false
        if (mine) {
          chance = 0.11 * (0.55 + 0.9 * mine.quality) * (0.7 + skill(taker, 'attr_finishing', 'attr_shooting') / 200)
          // El arquero rival adivina por azar hacia dónde va; si acierta, casi siempre la saca
          const guess = ['L', 'C', 'R'][Math.floor(kpRng() * 3)]
          if (guess === mine.aim) { chance *= 0.35; blocked = true }
          if (mine.quality < 0.15) chance = 0.02
        }
        // Quien defiende: la barrera de cinco baja la chance; si el arquero cubre la zona correcta, casi siempre la saca
        if (dmine) {
          if (dmine.mode === 'WALL') chance *= 0.7
          else if (dmine.mode === ps.aim) { chance *= 0.35; blocked = true }
          else chance *= 1.05
        }
        if (isHomeSet) homeShots++
        else awayShots++
        if (kpRng() < Math.min(0.5, chance)) {
          scoreGoal(taker.id, `¡GOLAZO DE TIRO LIBRE! ${taker.first_name} ${taker.last_name} la pone en el ángulo. ${quip('GOAL')}${styleLine(ps.team, 'FK_GOAL')}`)
        } else if (blocked) {
          if (isHomeSet) homeShotsOnTarget++
          else awayShotsOnTarget++
          const gk = getRandomPlayer(def.players, 'GK')
          events.push({ minute: min, type: 'SAVE', team: ps.team, text: `¡Atajadón de ${gk.first_name} ${gk.last_name} al tiro libre de ${taker.first_name} ${taker.last_name}! ${quip('SAVE')}${styleLine(ps.team, 'FK_SAVE')}` })
        } else {
          events.push({ minute: min, type: 'MISS', team: ps.team, text: `El tiro libre de ${taker.first_name} ${taker.last_name} se va por arriba del travesaño. ${quip('MISS')}${styleLine(ps.team, 'FK_MISS')}` })
        }
      }
    }
    // Una jugada clave nueva (poco frecuente): un mano a mano que se anuncia antes de resolverse
    if (min < 90 && !pendingPenalty && !pendingKeyPlay && kpRng() < 0.012) {
      const toHome = kpRng() < (curHomeAtt / (curHomeAtt + curAwayAtt))
      const kpTeam = toHome ? 'home' : 'away'
      pendingKeyPlay = { team: kpTeam, minute: min + 1 }
      events.push({ minute: min, type: 'KEYPLAY', team: kpTeam, text: `¡Mano a mano! ${toHome ? 'El local' : 'La visita'} se escapa solo contra el arquero y el estadio se queda sin aire.` })
    }

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

      const goalChance = Math.max(0.05, Math.min(0.5, Math.max(0.06, Math.min(0.42, ((isHome ? curHomeAtt : curAwayAtt) / ((isHome ? curHomeAtt : curAwayAtt) + (isHome ? curAwayDef : curHomeDef))) * 0.40)) * styleOf(teamId).goal))
      const shotRoll = rng()

      // Algunos remates quedan "en el aire" un minuto para que el DT reaccione con su arquero
      if (!pendingShot && min < 90 && kpRng() < 0.2) {
        pendingShot = { minute: min + 1, isHome, teamId, attacker, assister, goalkeeper, goalChance, shotRoll }
        events.push({ minute: min, type: 'SHOT', team: teamId, text: `¡Remate peligroso de ${attacker.first_name} ${attacker.last_name}! La pelota viaja hacia el arco...` })
      } else {
        resolveShot({ min, isHome, teamId, attacker, assister, goalkeeper, goalChance, shotRoll })
      }
    }

    // Faltas y amonestaciones (4% por minuto)
    if (rng() < 0.04) {
      const homeFoulShare = styleOf('home').foul / (styleOf('home').foul + styleOf('away').foul)
      const isHomeFoul = rng() < homeFoulShare
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
          text: `¡TARJETA ROJA! Expulsado ${playerFoul.first_name} ${playerFoul.last_name} por una falta temeraria. ${quip('RED')}${styleLine(isHomeFoul ? 'home' : 'away', 'RED')}`
        })
        foulTeam.reds++
        if (playerFoul.id) {
          foulTeam.redIds.add(playerFoul.id)
          if (foulTeam.players.length > 8) foulTeam.players = foulTeam.players.filter(p => p.id !== playerFoul.id)
        }
      } else if (cardRoll < 0.28 * styleOf(isHomeFoul ? 'home' : 'away').card) {
        // Amarilla
        if (isHomeFoul) homeYellows++
        else awayYellows++

        events.push({
          minute: min,
          type: 'CARD_YELLOW',
          team: isHomeFoul ? 'home' : 'away',
          playerId: playerFoul.id,
          text: `Amonestado ${playerFoul.first_name} ${playerFoul.last_name} tras cometer falta táctica en la mitad de la cancha. ${quip('YELLOW')}${styleLine(isHomeFoul ? 'home' : 'away', 'YELLOW')}`
        })
      }

      // Una falta cerca del área: tiro libre peligroso para el otro equipo
      if (!pendingSet && min < 90 && kpRng() < 0.3) {
        const fkTeam = isHomeFoul ? 'away' : 'home'
        const fkAim = ['L', 'C', 'R'][Math.floor(kpRng() * 3)]
        const defHint = kpRng() < 0.7 ? fkAim : ['L', 'C', 'R'][Math.floor(kpRng() * 3)]
        const fkSpecialist = specOf((fkTeam === 'home' ? homeTeam : awayTeam).players, fkTeam).FREE_KICK
        pendingSet = { kind: 'FK', team: fkTeam, minute: min + 1, aim: fkAim }
        events.push({ minute: min, type: 'SETPIECE_FK', team: fkTeam, defHint, takerName: fkSpecialist?.name || null, text: `Tiro libre peligroso para ${fkTeam === 'home' ? 'el local' : 'la visita'}, a unos veinte metros del arco${fkSpecialist ? `: se perfila ${fkSpecialist.name}` : ''}.${styleLine(fkTeam, 'SETPIECE_FK')}` })
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
        text: `Atención médica para ${injuredPlayer.first_name} ${injuredPlayer.last_name}. Presenta molestias físicas. ${quip('INJURY')}`
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
  async startMatch(fixtureId, userClubId, homeTactic, homePlayers, awayTactic, awayPlayers, seed = null, { userPowerFactor = 1, userIsHome = null, userTakers = null, rivalStyle = null } = {}) {
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
    // El rival (IA) es el lado que no dirige el usuario: reacciona al marcador durante el partido
    const options = {
      homeAdvantage: homeAdvantageFactor, homePowerFactor, awayPowerFactor,
      aiSide: userIsHome === null ? null : (userIsHome ? 'away' : 'home'),
      // Especialistas que el DT fijó a mano (solo en su lado)
      specialistOverrides: userTakers && userIsHome !== null ? { [userIsHome ? 'home' : 'away']: userTakers } : null,
      // Personalidad de juego del rival (el lado que no dirige el usuario)
      styles: rivalStyle && userIsHome !== null ? { [userIsHome ? 'away' : 'home']: rivalStyle } : null
    }
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
  async finalizeMatch(fixtureId, clubId, isHome, oppName, homeScore, awayScore, events = [], _stats = {}) {
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
