/**
 * Valor de los jugadores a la escala de la caja del club (unos $25.000). Funciones puras.
 * La misma fórmula vive en la base (`player_value`, `seller_factor`): los tests las comparan con valores fijos.
 */

export const VALUE_MIN = 1500
export const VALUE_MAX = 150000
export const FREE_AGENT_FACTOR = 0.6 // un agente libre pide el 60% del valor (prima de firma)
export const MIN_ACCEPTABLE = 0.85 // el club vendedor acepta desde el 85% de lo que pide

const ageFactor = (age) => (age <= 20 ? 1.15 : age <= 25 ? 1.0 : age <= 28 ? 0.9 : age <= 31 ? 0.7 : 0.45)

/** Valor de mercado: crece con la media (+12% por punto), con el potencial no alcanzado y con la juventud; redondeado a $50 */
export function playerValue({ ovr = 50, potential = null, age = 25 } = {}) {
  const pot = potential ?? ovr
  const raw = 6000 * Math.exp(0.12 * (ovr - 55)) * (1 + Math.max(0, pot - ovr) * 0.012) * ageFactor(age)
  return Math.min(VALUE_MAX, Math.max(VALUE_MIN, Math.round(raw / 50) * 50))
}

/** Valor de un jugador a partir de sus columnas de la base */
export const valueOfPlayer = (p) => playerValue({ ovr: p.attr_overall || p.overall || 50, potential: p.attr_potential, age: p.age || 25 })

/** Peso del club vendedor: de 0,90 (reputación 0) a 1,30 (reputación 100) */
export const sellerFactor = (reputation = 50) => 0.9 + 0.004 * Math.max(0, Math.min(100, reputation ?? 50))

/** Lo que pide el club por el jugador (o el agente, si es libre) */
export function askingPrice(value, sellerReputation = null, isFreeAgent = false) {
  return Math.round(value * (isFreeAgent ? FREE_AGENT_FACTOR : sellerFactor(sellerReputation ?? 50)))
}

/** Lo mínimo que acepta el vendedor */
export const minAcceptable = (asking) => Math.round(asking * MIN_ACCEPTABLE)
