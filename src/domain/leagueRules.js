/**
 * Reglamentos del torneo que votan los DT cada año (la "Asamblea de la AFA").
 * Un reglamento es un objeto `rules` con valores por defecto = el torneo de siempre; funciones puras y deterministas.
 */
import { seededRandom } from './cupMatch'
import { rivalNames } from './rivalNames'

export const DEFAULT_RULES = Object.freeze({
  legs: 2, // ruedas: 2 = ida y vuelta, 1 = solo ida
  winPts: 3,
  drawPts: 1,
  awayWinPts: 3, // lo que suma ganar de visitante
  nilNilPts: 1, // lo que suma cada uno en un 0-0
  bigWinBonus: 0, // extra por ganar por 3 goles o más
  cleanSheetBonus: 0, // extra por no recibir goles (ganando o empatando)
  lastRoundsX2: 0, // cuántas fechas finales valen doble
  promoted: 2,
  relegated: 3
})

/** Completa un reglamento (o nada) con los valores por defecto */
export const normalizeRules = (rules) => ({ ...DEFAULT_RULES, ...(rules || {}) })

/** Catálogo: `tags` orientan la personalidad de los DT bots al votar */
export const RULESETS = [
  { id: 'CLASICO', name: 'El clásico de siempre', blurb: 'Todo como antes: ida y vuelta, 3 puntos por victoria. Para los que no se animan a nada.', tags: ['tradicional'], rules: {} },
  { id: 'EXPRESS', name: 'El Torneo Express', blurb: 'Solo ida: 19 fechas y a casa. Hay menos tiempo para arrepentirse.', tags: ['tradicional', 'show'], rules: { legs: 1 } },
  { id: 'CERO_CERO', name: 'Cero a cero prohibido', blurb: 'Si el partido termina 0-0, nadie suma. Los amarretes lloran, los hinchas aplauden.', tags: ['show'], rules: { nilNilPts: 0 } },
  { id: 'VISITANTE_DORADO', name: 'Visitante dorado', blurb: 'Ganar de visitante vale 4 puntos. Viajar por fin tiene premio.', tags: ['ambicioso', 'show'], rules: { awayWinPts: 4 } },
  { id: 'GOLEADA_MONO', name: 'Goleada con moño', blurb: 'Ganar por 3 goles o más regala un punto extra. Se aceptan sobrinos de árbitros.', tags: ['show'], rules: { bigWinBonus: 1 } },
  { id: 'VALLA_INVICTA', name: 'Valla invicta', blurb: 'Arco en cero, punto extra. El arquero pide aumento en la asamblea.', tags: ['amarrete'], rules: { cleanSheetBonus: 1 } },
  { id: 'RECTA_LOCA', name: 'Recta final a lo loco', blurb: 'Las últimas 5 fechas valen doble. Nadie está salvado hasta el final.', tags: ['show', 'ambicioso'], rules: { lastRoundsX2: 5 } },
  { id: 'SUBEN_CUATRO', name: 'Suben los cuatro', blurb: 'Ascienden 4 equipos y bajan 3. La AFA repartió ascensos como panchos.', tags: ['ambicioso'], rules: { promoted: 4, relegated: 3 } },
  { id: 'GUILLOTINA', name: 'La guillotina', blurb: 'Sube uno solo y bajan cinco. Cada fecha es una final de vida o muerte.', tags: ['amarrete'], rules: { promoted: 1, relegated: 5 } },
  { id: 'EMPATE_FESTIVO', name: 'Empate festivo', blurb: 'Empatar vale 2 puntos. El que arregla, gana (dicen).', tags: ['amarrete'], rules: { drawPts: 2 } }
]

export const rulesFor = (id) => normalizeRules(RULESETS.find(r => r.id === id)?.rules)

export const rulesetName = (id) => RULESETS.find(r => r.id === id)?.name || RULESETS[0].name

/** Las 3 opciones del año: siempre las mismas para la misma semilla */
export function pickBallot(seed, count = 3) {
  const rand = seededRandom(`ballot:${seed}`)
  const pool = RULESETS.map(r => r.id)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

const STYLES = ['tradicional', 'ambicioso', 'amarrete', 'show']
const QUIPS = {
  tradicional: ['votó lo de siempre, con boina y todo', 'dijo "en mis tiempos no hacía falta votar"', 'votó mirando el reloj de la sede'],
  ambicioso: ['votó con una sonrisa y un maletín', 'votó pensando en el ascenso', 'votó sin leer, pero con muchas ganas de subir'],
  amarrete: ['votó la opción que menos goles prometía', 'votó con una calculadora en la mano', 'votó cuidándose del descenso'],
  show: ['votó lo más descontrolado para la tele', 'votó entre risas y un choripán', 'votó lo que daba más memes']
}

/** Los votos de los DT de los otros clubes: `clubs` son ids o `{ id, name }` */
export function botVotes(seed, clubs, ballot) {
  return (clubs || []).map((c) => {
    const id = typeof c === 'string' ? c : c.id
    const rand = seededRandom(`vote:${seed}:${id}`)
    const style = STYLES[Math.floor(rand() * STYLES.length)]
    let best = ballot[0]
    let bestScore = -1
    for (const opt of ballot) {
      const tags = RULESETS.find(r => r.id === opt)?.tags || []
      const score = rand() + (tags.includes(style) ? 0.8 : 0)
      if (score > bestScore) { best = opt; bestScore = score }
    }
    const who = (typeof c === 'object' && c.name) ? `El DT de ${c.name}` : `El DT ${rivalNames(`${seed}:${id}`, 1)[0].last_name}`
    const quips = QUIPS[style]
    return { clubId: id, style, choice: best, quip: `${who} ${quips[Math.floor(rand() * quips.length)]}.` }
  })
}

/** Escrutinio: gana la mayoría; si hay empate, desempata el voto del usuario (o el primero de la boleta) */
export function tally(botVotesList, userVote, ballot) {
  const counts = Object.fromEntries(ballot.map(id => [id, 0]))
  for (const v of botVotesList || []) if (v.choice in counts) counts[v.choice]++
  if (userVote in counts) counts[userVote]++
  const max = Math.max(...Object.values(counts))
  const leaders = ballot.filter(id => counts[id] === max)
  const winner = leaders.includes(userVote) ? userVote : leaders[0]
  return { counts, winner }
}

/** Puntos que suma un club por un partido (misma cuenta que `apply_league_result` en la base) */
export function pointsFor(rules, { goalsFor, goalsAgainst, away = false, round = 0, rounds = 0 }) {
  const r = normalizeRules(rules)
  let pts
  if (goalsFor > goalsAgainst) pts = (away ? r.awayWinPts : r.winPts) + (goalsFor - goalsAgainst >= 3 ? r.bigWinBonus : 0)
  else if (goalsFor === goalsAgainst) pts = goalsFor === 0 ? r.nilNilPts : r.drawPts
  else pts = 0
  if (goalsAgainst === 0 && goalsFor >= goalsAgainst && !(goalsFor === 0 && r.nilNilPts === 0)) pts += r.cleanSheetBonus
  if (r.lastRoundsX2 > 0 && rounds > 0 && round > rounds - r.lastRoundsX2) pts *= 2
  return pts
}

/** Qué reglamento del catálogo es este (o null si no coincide con ninguno) */
export function rulesetIdFor(rules) {
  const r = normalizeRules(rules)
  return RULESETS.find(s => Object.keys(DEFAULT_RULES).every(k => normalizeRules(s.rules)[k] === r[k]))?.id || null
}
