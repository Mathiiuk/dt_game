/**
 * Pretensiones de contrato de un jugador y finiquito de una rescisión. Funciones puras.
 * La misma fórmula vive en la base (`contract_demands`, `terminate_contract`): los tests las comparan con valores fijos.
 * La escala salarial es la de los planteles: un 56 de media cobra unos $115 por semana.
 */
import { weeksBetween } from './contracts'

export const SEVERANCE_FACTOR = 0.65 // el finiquito es el 65% de los sueldos que faltan
export const DEFAULT_SEVERANCE_WEEKS = 26 // sin fecha de vencimiento se calcula con media temporada
export const MAX_NEGOTIATION_ROUNDS = 3
export const LOCKOUT_WEEKS = 4

/** Sueldo semanal de un jugador de esa media (misma curva con la que se arman los planteles) */
const rawWage = (ovr) => 120 * Math.pow((Math.max(40, Math.min(99, ovr || 50)) - 7) / 50, 1.85)
export const wageForOvr = (ovr) => Math.round(rawWage(ovr))

/**
 * Pretensiones del jugador: sueldo (más si es ambicioso o tiene potencial por explotar), rol, años y cláusula sugerida.
 * @param {{ attr_overall?: number, age?: number, attr_potential?: number, personality?: string, market_value?: number }} player
 */
export function playerDemands(player) {
  if (!player) return null
  const ovr = Math.max(40, Math.min(99, player.attr_overall || 50))
  const age = player.age || 25
  const pot = player.attr_potential ?? ovr
  const ambitious = player.personality === 'Ambicioso' || player.personality === 'Estrella'

  const expectedWage = Math.round(rawWage(ovr) * (ambitious ? 1.2 : 1) * (1 + Math.max(0, pot - ovr) * 0.01))
  let desiredRole = 'ROTATION'
  if (ovr >= 75) desiredRole = 'KEY_PLAYER'
  else if (ovr >= 65) desiredRole = 'FIRST_TEAM'
  else if (age <= 21 && pot >= 75) desiredRole = 'PROSPECT'
  else if (ovr < 55) desiredRole = 'BACKUP'

  return {
    expectedWage,
    minAcceptableWage: Math.round(expectedWage * 0.85),
    desiredRole,
    desiredYears: age <= 23 ? 3 : age >= 31 ? 1 : 2,
    suggestedReleaseClause: Math.round((player.market_value || ovr * 100) * 3),
    isAmbitious: ambitious
  }
}

/** Finiquito de una rescisión unilateral: 65% de los sueldos que faltan hasta el vencimiento del contrato */
export function severanceCost({ contract_salary, contract_end } = {}, gameDate = null) {
  const weeks = contract_end && gameDate ? Math.max(1, weeksBetween(gameDate, contract_end)) : DEFAULT_SEVERANCE_WEEKS
  return Math.round(weeks * (contract_salary || 500) * SEVERANCE_FACTOR)
}
