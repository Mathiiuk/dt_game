/**
 * Reglas del escenario de historias (pantalla completa). Funciones puras.
 * Cada capítulo se decide de una forma distinta para que no se sienta siempre lo mismo:
 *  - HOLD: elegís una carta y la confirmás manteniendo apretado.
 *  - COIN: además de las cartas, podés dejar que decida la suerte (moneda).
 *  - TIMER: decidís contra reloj; si se acaba el tiempo, el narrador elige lo más prudente.
 */

export const STAGE_MODES = ['HOLD', 'COIN', 'TIMER']
export const HOLD_MS = 900
export const TIMER_SECONDS = 12

const hash = (str) => { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

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
