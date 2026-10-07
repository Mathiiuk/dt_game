/**
 * Lógica pura de la vista del calendario: filtros por fase y detección de partido pendiente.
 */
import { isFixtureDue, isFixtureOpen } from './fixtureStatus'

export const CALENDAR_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'APERTURA', label: 'Apertura' },
  { value: 'CLAUSURA', label: 'Clausura' },
  { value: 'TRANSFERS', label: 'Fichajes' },
  { value: 'MATCHES', label: 'Partidos' },
  { value: 'HOME', label: 'De local' },
  { value: 'AWAY', label: 'De visitante' }
]

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export const filterWeeks = (weeks, filter, clubId) =>
  weeks.filter(w => {
    switch (filter) {
      case 'APERTURA': return w.phase === 'REGULAR_SEASON_APERTURA'
      case 'CLAUSURA': return w.phase === 'REGULAR_SEASON_CLAUSURA'
      case 'TRANSFERS': return !!w.transferWindowOpen
      case 'MATCHES': return !!w.match
      case 'HOME':
        return !!w.match && (w.match.is_home !== undefined ? w.match.is_home : (clubId ? w.match.home_club_id === clubId : true))
      case 'AWAY':
        return !!w.match && (w.match.is_home !== undefined ? !w.match.is_home : (clubId ? w.match.away_club_id === clubId : true))
      default: return true
    }
  })

/** Próximos partidos abiertos del club (hasta el límite dado) */
export const getUpcomingMatches = (weeks, limit = 5) => {
  return weeks
    .filter(w => w.match && isFixtureOpen(w.match.status))
    .slice(0, limit)
}

/** Partidos ya disputados, ordenados del más reciente al más antiguo */
export const getRecentResults = (weeks, limit = 5) => {
  return [...weeks]
    .filter(w => w.match && !isFixtureOpen(w.match.status))
    .reverse()
    .slice(0, limit)
}

/** Agrupa las semanas de la temporada por mes para la vista compacta */
export const groupWeeksByMonth = (weeks) => {
  const groups = []
  const groupMap = new Map()

  for (const w of weeks) {
    if (!w.date) continue
    const [yearStr, monthStr] = w.date.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10) - 1
    const key = `${year}-${String(month + 1).padStart(2, '0')}`

    if (!groupMap.has(key)) {
      const entry = {
        key,
        year,
        month,
        label: `${MONTH_NAMES[month]} ${year}`,
        weeks: []
      }
      groupMap.set(key, entry)
      groups.push(entry)
    }

    groupMap.get(key).weeks.push(w)
  }

  return groups
}

/** Partido del club que ya debería haberse jugado en la fecha actual y sigue abierto (bloquea el avance) */
export const findDueMatch = (weeks, currentDate) =>
  weeks.map(w => w.match).find(m => m && isFixtureOpen(m.status) && isFixtureDue(m.match_date, currentDate)) || null

/** Próximo partido por jugar (el primero abierto, esté vencido o no) */
export const findNextMatch = (weeks) => weeks.map(w => w.match).find(m => m && isFixtureOpen(m.status)) || null

