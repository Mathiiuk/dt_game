/**
 * Reglas del escenario de historias (pantalla completa). Funciones puras.
 * Cada capítulo se decide de una forma distinta para que no se sienta siempre lo mismo:
 *  - HOLD: elegís una carta y la confirmás manteniendo apretado.
 *  - COIN: además de las cartas, podés dejar que decida la suerte (moneda).
 *  - TIMER: decidís contra reloj; si se acaba el tiempo, el narrador elige lo más prudente.
 *  - TARGET: una barra recorre las opciones y la frenás sobre la que querés (puntería).
 */

export const STAGE_MODES = ['HOLD', 'COIN', 'TIMER', 'TARGET']
// Las decisiones urgentes se piensan: sin moneda ni reloj que decidan por vos (mantener apretado o puntería)
export const CRITICAL_STAGE_MODES = ['HOLD', 'TARGET']

/** Cómo se llama cada tipo de evento en la cabecera de la pantalla completa (las historias con capítulos usan el título de la historia) */
export const EVENT_KIND_LABEL = {
  COMMUNITY: 'Comunidad y barrio',
  LOCKER_ROOM: 'Vestuario',
  BOARD_PRESS: 'Dirigencia y prensa',
  FINANCIAL_CRISIS: 'Crisis de plata'
}
export const HOLD_MS = 900
export const TIMER_SECONDS = 12

const hash = (str) => {
  let h = 0
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  // Mezcla final: sin esto, los códigos parecidos (ARC_X_1, ARC_X_2...) caen siempre en la misma combinación
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** Modo de decisión del capítulo: estable para el mismo evento */
export const stageModeFor = (event) => {
  const pool = event?.severity === 'CRITICAL' ? CRITICAL_STAGE_MODES : STAGE_MODES
  return pool[hash(event?.template_code || event?.id || '') % pool.length]
}

/** ¿Se puede elegir esta opción? (alcanza la caja y la dirigencia la respalda) */
export const canChoose = (opt, { budget = 0, boardConfidence = 100 } = {}) => {
  const cost = Number(opt?.cost || 0)
  const needsBoard = Number(opt?.requires?.board || 0)
  return (cost === 0 || budget >= cost) && (!needsBoard || boardConfidence >= needsBoard)
}

const weight = (opt) => Object.values(opt?.effects || {}).reduce((n, v) => n + Math.abs(Number(v) || 0), 0)

/** Lo más prudente: gratis y de menor efecto (si se acaba el tiempo decide el narrador) */
export function safestOption(options = [], ctx = {}) {
  const available = options.filter(o => canChoose(o, ctx))
  const pool = available.length ? available : options
  return [...pool].sort((a, b) => (Number(a.cost || 0) - Number(b.cost || 0)) || (weight(a) - weight(b)))[0] || null
}

/** Una opción al azar entre las que se pueden elegir */
export function randomOption(options = [], ctx = {}, rng = Math.random) {
  const available = options.filter(o => canChoose(o, ctx))
  const pool = available.length ? available : options
  return pool[Math.floor(rng() * pool.length)] || null
}

// ---------------------------------------------------------------------------------------------
// Desafíos de pista: antes de decidir, algunos capítulos proponen un minijuego. Si se gana, el narrador te da una pista
// (se ven los efectos de cada opción); si se pierde, se decide a ciegas como siempre. Perder no cuesta nada.
// ---------------------------------------------------------------------------------------------

export const CHALLENGES = ['SEQUENCE', 'TAPS', 'RUMOR', 'REFLEX', 'BILLS']
export const TAP_GOAL = 18
export const TAP_SECONDS = 5
export const REFLEX_TARGETS = 5
export const REFLEX_NEEDED = 3
export const BILLS_COUNT = 6
export const BILLS_NEEDED = 5
export const BILLS_SECONDS = 9

// Cada tipo de evento tiene su minijuego propio, que sale más seguido que los compartidos:
//  - Comunidad y barrio: el cántico (ritmo)  - Vestuario: calmar la tensión  - Dirigencia y prensa: armar el titular  - Crisis de plata: cuadrar la caja
export const CATEGORY_CHALLENGES = { COMMUNITY: 'CHANT', LOCKER_ROOM: 'CALM', BOARD_PRESS: 'HEADLINE', FINANCIAL_CRISIS: 'BALANCE' }
export const ALL_CHALLENGES = [...CHALLENGES, ...Object.values(CATEGORY_CHALLENGES)]

/**
 * Desafío del capítulo (o ninguno): estable para el mismo evento.
 * El de billetes sólo sale en las crisis de plata; el propio del tipo de evento entra dos veces en el sorteo.
 */
export const challengeFor = (event) => {
  const money = event?.category === 'FINANCIAL_CRISIS'
  const own = CATEGORY_CHALLENGES[event?.category]
  const pool = [...CHALLENGES.filter(c => money || c !== 'BILLS'), ...(own ? [own, own] : [])]
  // La mitad de los eventos no traen desafío: jugar siempre cansa, y así cada desafío sorprende
  const n = hash(`${event?.template_code || event?.id || ''}:desafio`) % (pool.length * 2)
  return pool[n] || null
}

/** ¿Es un capítulo de una historia con varios capítulos? (los eventos sueltos del club no lo son) */
export const isArcEvent = (event) => String(event?.template_code || '').startsWith('ARC_')

/** Los capítulos de una historia llevan su número en el título: "Un pibe que la rompe (1/4)" → { current: 1, total: 4, clean } */
export const chapterOf = (title) => {
  const m = String(title || '').match(/\((\d+)\s*\/\s*(\d+)\)\s*$/)
  return m ? { current: Number(m[1]), total: Number(m[2]), clean: String(title).replace(m[0], '').trim() } : null
}

/**
 * Qué evento se abre solo a pantalla completa al entrar al inicio: uno solo por visita, para que no cansen.
 * Primero las decisiones urgentes, después los capítulos de historias y por último los eventos sueltos (en el orden recibido).
 * Los que se dejaron "para más tarde" no se vuelven a abrir solos. El resto queda en el inicio para jugarlo cuando se quiera.
 */
export function pickAutoStage(events = [], postponed = new Set()) {
  const open = (events || []).filter(e => e && !postponed.has(e.id))
  const rank = (e) => (e.severity === 'CRITICAL' ? 0 : isArcEvent(e) ? 1 : 2)
  return [...open].sort((a, b) => rank(a) - rank(b))[0] || null
}

/** Noticias que aparecen una a una: lugar (en %), espera previa y cuánto duran a la vista (ms) */
export const buildReflexTargets = (rng = Math.random, count = REFLEX_TARGETS) => Array.from({ length: count }, () => ({
  x: 12 + Math.floor(rng() * 76),
  y: 12 + Math.floor(rng() * 70),
  wait: 350 + Math.floor(rng() * 650),
  life: 1100
}))

/** Billetes sueltos: lugar de arranque (en %) en la parte alta del área */
export const buildBills = (rng = Math.random, count = BILLS_COUNT) => Array.from({ length: count }, (_, i) => ({
  id: i,
  x: 10 + Math.floor(rng() * 80),
  y: 6 + Math.floor(rng() * 38)
}))

export const reflexWon = (hits) => hits >= REFLEX_NEEDED
export const billsWon = (saved) => saved >= BILLS_NEEDED

/** Secuencia de símbolos para memorizar: números del 0 al `symbols - 1`, de largo `length` */
export const buildSequence = (rng = Math.random, length = 4, symbols = 6) => Array.from({ length }, () => Math.floor(rng() * symbols))

/** Afirmaciones de fútbol para el desafío de verdadero o falso (`ok` = lo que hay que contestar) */
export const RUMORS = [
  { text: 'El penal se patea desde los once metros.', ok: true },
  { text: 'Un partido profesional dura ochenta minutos.', ok: false },
  { text: 'Cada equipo juega con once en la cancha.', ok: true },
  { text: 'Desde un tiro de esquina no hay posición adelantada.', ok: true },
  { text: 'El arco mide siete metros con treinta y dos de ancho.', ok: true },
  { text: 'Fuera del área, cualquier jugador puede agarrarla con la mano.', ok: false },
  { text: 'En un partido oficial se pueden hacer ocho cambios.', ok: false },
  { text: 'Una tarjeta roja expulsa al jugador.', ok: true },
  { text: 'El Mundial se juega cada cuatro años.', ok: true },
  { text: 'La pelota reglamentaria es cuadrada.', ok: false },
  { text: 'El árbitro puede mostrar tarjeta amarilla a un suplente.', ok: true },
  { text: 'Un gol vale dos puntos en la tabla.', ok: false }
]

/** Tres afirmaciones distintas al azar */
export function pickRumors(rng = Math.random, count = 3) {
  const pool = [...RUMORS]
  const out = []
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  return out
}

/** Se gana el verdadero o falso con dos aciertos de tres (o más) */
export const rumorWon = (answers = [], rumors = []) => answers.filter((a, i) => rumors[i] && a === rumors[i].ok).length >= Math.max(1, rumors.length - 1)

/** Opción sobre la que cayó el marcador de la barra de puntería (`pos` va de 0 a 1) */
export const optionAtPosition = (pos, count) => Math.max(0, Math.min(count - 1, Math.floor(Math.max(0, Math.min(0.9999, pos)) * count)))


// ---------------------------------------------------------------------------------------------
// Minijuegos propios de cada tipo de evento
// ---------------------------------------------------------------------------------------------

/** EL CÁNTICO (comunidad y barrio): cuatro golpes de ritmo; hay que tocar cuando llegan. Con tres se gana. */
export const CHANT_BEATS = 4
export const CHANT_WINDOW_MS = 260
export const CHANT_NEEDED = 3
/** Instantes (ms desde que arranca) en que cae cada golpe: el primero tras un respiro y los demás a ritmo parejo pero no clavado */
export function buildChant(rng = Math.random, count = CHANT_BEATS) {
  let at = 1100
  return Array.from({ length: count }, () => { const beat = { at }; at += 650 + Math.floor(rng() * 350); return beat })
}
export const chantHit = (tapAt, beatAt) => Math.abs(tapAt - beatAt) <= CHANT_WINDOW_MS
export const chantWon = (hits) => hits >= CHANT_NEEDED

/** CALMAR AL VESTUARIO (vestuario): la tensión sube sola; tocando baja. Hay que sostenerla en la franja verde. */
export const CALM_SECONDS = 9
export const CALM_TICK_MS = 250
export const CALM_BAND = [35, 65]
export const CALM_NEEDED = 5.5
export const CALM_START = 50
/** Un instante del juego: sube entre 2 y 6 puntos solo y un toque la baja 8. Cuenta el tiempo que estuvo en la franja. */
export function calmTick({ tension = CALM_START, seconds = 0 } = {}, tapped = false, rng = Math.random) {
  const next = Math.max(0, Math.min(100, tension + 2 + Math.floor(rng() * 5) - (tapped ? 8 : 0)))
  const inBand = next >= CALM_BAND[0] && next <= CALM_BAND[1]
  return { tension: next, seconds: inBand ? seconds + CALM_TICK_MS / 1000 : seconds }
}
export const calmWon = (seconds) => seconds >= CALM_NEEDED

/** ARMÁ EL TITULAR (dirigencia y prensa): las palabras vienen mezcladas y hay que tocarlas en orden. Dos errores y se pierde. */
export const HEADLINES = [
  ['EL', 'PIBE', 'SALVÓ', 'AL', 'CLUB'],
  ['LA', 'TRIBUNA', 'CANTÓ', 'TODA', 'LA', 'NOCHE'],
  ['EL', 'DT', 'LE', 'PUSO', 'FRENO', 'AL', 'VESTUARIO'],
  ['LA', 'DIRIGENCIA', 'SE', 'REUNIÓ', 'DE', 'URGENCIA'],
  ['EL', 'POTRERO', 'SE', 'VISTIÓ', 'DE', 'FIESTA'],
  ['NADIE', 'SE', 'ESPERABA', 'ESE', 'GOLAZO']
]
export const HEADLINE_MISTAKES = 2
export function buildHeadline(rng = Math.random) {
  const answer = HEADLINES[Math.min(HEADLINES.length - 1, Math.floor(rng() * HEADLINES.length))]
  let words = answer.map((text, i) => ({ id: i, text }))
  // Mezcla de Fisher-Yates; si por casualidad queda en el mismo orden se rota para que siempre haya algo que ordenar
  for (let i = words.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(rng() * (i + 1))); [words[i], words[j]] = [words[j], words[i]] }
  if (words.every((w, i) => w.id === i)) words = [...words.slice(1), words[0]]
  return { answer, words }
}
/** La palabra tocada: es la que sigue en el titular (id = posición) o es un error */
export const headlineNext = (placed = [], word) => (word?.id === placed.length ? 'OK' : 'MISTAKE')

/** CUADRAR LA CAJA (crisis de plata): elegir los gastos que suman exactamente lo que falta cubrir. Dos intentos. */
export const BALANCE_TRIES = 2
const EXPENSES = ['Luz', 'Sueldos', 'Cantina', 'Viáticos', 'Pelotas', 'Arreglos', 'Colectivo', 'Seguro']
export function buildBalance(rng = Math.random, count = 5) {
  const pool = [...EXPENSES]
  const items = Array.from({ length: count }, (_, id) => {
    const at = Math.min(pool.length - 1, Math.floor(rng() * pool.length))
    const [label] = pool.splice(at, 1)
    return { id, label, amount: (2 + Math.floor(rng() * 9)) * 100 } // de $200 a $1.000
  })
  // El monto a cubrir sale de una combinación real de dos o tres gastos: siempre hay solución
  const size = 2 + Math.floor(rng() * 2)
  const chosen = [...items].sort(() => rng() - 0.5).slice(0, size)
  return { items, target: chosen.reduce((n, it) => n + it.amount, 0) }
}
export const balanceSum = (selectedIds = [], items = []) => items.filter(it => selectedIds.includes(it.id)).reduce((n, it) => n + it.amount, 0)
export const balanceWon = (selectedIds, items, target) => selectedIds.length > 0 && balanceSum(selectedIds, items) === target
