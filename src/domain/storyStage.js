/**
 * Reglas del escenario de historias (pantalla completa). Funciones puras.
 * Cada capítulo se decide de una forma distinta para que no se sienta siempre lo mismo:
 *  - HOLD: elegís una carta y la confirmás manteniendo apretado.
 *  - COIN: además de las cartas, podés dejar que decida la suerte (moneda).
 *  - TIMER: decidís contra reloj; si se acaba el tiempo, el narrador elige lo más prudente.
 *  - TARGET: una barra recorre las opciones y la frenás sobre la que querés (puntería).
 */

export const STAGE_MODES = ['HOLD', 'COIN', 'TIMER', 'TARGET']
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
export const stageModeFor = (event) => STAGE_MODES[hash(event?.template_code || event?.id || '') % STAGE_MODES.length]

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

export const CHALLENGES = ['SEQUENCE', 'TAPS', 'RUMOR']
export const TAP_GOAL = 18
export const TAP_SECONDS = 5

/** Desafío del capítulo (o ninguno): estable para el mismo evento */
export const challengeFor = (event) => {
  const n = hash(`${event?.template_code || event?.id || ''}:desafio`) % (CHALLENGES.length + 1)
  return CHALLENGES[n] || null
}

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
