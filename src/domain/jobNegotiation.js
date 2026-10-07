// Negociación de una oferta de trabajo: pedís un sueldo semanal mayor y el club responde según tu reputación frente a lo que
// exige el puesto. Dos rondas como máximo. Funciones puras.
export const JOB_MAX_ROUNDS = 2
export const BASE_RAISE = 0.05 // sin ventaja de reputación el club admite 5% más
export const MAX_RAISE = 0.30 // con 20 o más puntos de ventaja, hasta 30% más
const OFFENSE_MARGIN = 0.15 // pedir más de 15 puntos por encima de lo que da el club lo ofende y retira la oferta

/** Máximo cociente sueldo pedido / sueldo ofrecido que el club acepta según tu ventaja de reputación */
export function maxRaiseRatio(reputation = 0, requiredReputation = 0) {
  const edge = Math.max(0, Math.min(1, (reputation - requiredReputation) / 20))
  return 1 + BASE_RAISE + (MAX_RAISE - BASE_RAISE) * edge
}

/**
 * @param {{ offered: number, ask: number, reputation: number, requiredReputation: number, round: number }} p
 * @returns {{ status: 'ACCEPTED'|'COUNTER'|'WITHDRAWN'|'FINAL'|'INVALID'|'CLOSED', wage: number, round: number }}
 */
export function negotiateJob({ offered, ask, reputation, requiredReputation, round = 1 }) {
  if (round > JOB_MAX_ROUNDS) return { status: 'CLOSED', wage: offered, round }
  if (!(ask > offered)) return { status: 'INVALID', wage: offered, round }

  const ratio = ask / offered
  const limit = maxRaiseRatio(reputation, requiredReputation)

  // Segunda ronda: el club ya contraofertó y no se mueve más
  if (round >= 2) {
    return ratio <= 1.03 ? { status: 'ACCEPTED', wage: ask, round } : { status: 'FINAL', wage: offered, round }
  }

  if (ratio <= limit + 1e-9) return { status: 'ACCEPTED', wage: ask, round }
  if (ratio <= limit + OFFENSE_MARGIN) return { status: 'COUNTER', wage: Math.round(offered * limit), round }
  return { status: 'WITHDRAWN', wage: 0, round }
}
