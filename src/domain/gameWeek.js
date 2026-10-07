/**
 * Semana y temporada a partir de la fecha de juego (la temporada arranca el 1 de julio y tiene 52 semanas).
 */
export const WEEKS_PER_SEASON = 52
export const FIRST_SEASON_YEAR = 2026

const MS_PER_DAY = 86400000
const toDay = (d) => String(d).slice(0, 10)

/** Año de la temporada que contiene la fecha */
export const seasonYearOf = (dateString) => {
  const d = new Date(`${toDay(dateString)}T00:00:00Z`)
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1
}

/** Semana (1-52) de la temporada de la fecha; el 1 de julio es la semana 1 */
export const weekOfDate = (dateString) => {
  const d = new Date(`${toDay(dateString)}T00:00:00Z`)
  const start = new Date(Date.UTC(seasonYearOf(dateString), 6, 1))
  const week = Math.floor((d - start) / MS_PER_DAY / 7) + 1
  return Math.min(WEEKS_PER_SEASON, Math.max(1, week))
}

/**
 * Semana ABSOLUTA del juego (no se reinicia al cambiar de temporada): sirve para enfriamientos y plazos
 * que cruzan el cierre de temporada (semana 50 de una temporada y semana 2 de la siguiente están a 4 semanas).
 */
export const absoluteWeek = (dateString) => (seasonYearOf(dateString) - FIRST_SEASON_YEAR) * WEEKS_PER_SEASON + weekOfDate(dateString)

/** La temporada terminó para el juego cuando se llega a la última semana: ahí se cierra desde la gala (no se avanza más) */
export const isSeasonEnded = (dateString) => weekOfDate(dateString) >= WEEKS_PER_SEASON
