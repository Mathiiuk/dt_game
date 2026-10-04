/**
 * Estados canónicos de un partido (tabla fixtures).
 * Históricamente convivieron PENDING/SCHEDULED y FINISHED/PLAYED; las lecturas aceptan los alias
 * heredados y las escrituras usan SOLO los valores canónicos.
 */
export const FIXTURE_STATUS = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAYED: 'PLAYED'
})

// Valores que significan "partido por jugar" (incluye el alias heredado PENDING)
export const FIXTURE_OPEN_STATUSES = ['SCHEDULED', 'PENDING']

// Valores que significan "partido ya disputado" (incluye el alias heredado FINISHED)
export const FIXTURE_PLAYED_STATUSES = ['PLAYED', 'FINISHED']

export const isFixtureOpen = (status) => FIXTURE_OPEN_STATUSES.includes(status)
export const isFixturePlayed = (status) => FIXTURE_PLAYED_STATUSES.includes(status)

/** Compara solo la parte de fecha (YYYY-MM-DD): admite match_date con hora (ISO) sin falsos "futuro" */
export const toDay = (value) => (value ? String(value).slice(0, 10) : '')

/** true si el partido ya puede disputarse en la fecha de juego actual */
export const isFixtureDue = (matchDate, gameDate) => !!matchDate && toDay(matchDate) <= toDay(gameDate)
