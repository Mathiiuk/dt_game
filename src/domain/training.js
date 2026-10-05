/**
 * Reglas puras de la pantalla de Entrenamiento: condición física del plantel y restricciones por edad.
 */

export const CRITICAL_FITNESS = 60
export const YOUTH_AGE = 22
export const VETERAN_AGE = 29

/** Condición física media del plantel (75 si no hay jugadores, como valor neutro) */
export const averageFitness = (players) =>
  players.length ? Math.round(players.reduce((sum, p) => sum + (p.state_fitness || 0), 0) / players.length) : 75

export const isCriticalFitness = (avg) => avg < CRITICAL_FITNESS

export const isYouth = (p) => (p.age || 20) < YOUTH_AGE
export const isVeteran = (p) => (p.age || 20) > VETERAN_AGE

/** Los veteranos no desarrollan atributos físicos */
export const isAttributeLocked = (player, attrId) => isVeteran(player) && (attrId === 'pace' || attrId === 'stamina')

export const fitnessTone = (fitness) => ((fitness ?? 75) < CRITICAL_FITNESS ? 'danger' : 'accent')
