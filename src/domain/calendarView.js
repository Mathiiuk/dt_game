/**
 * Lógica pura de la vista del calendario: filtros por fase y detección de partido pendiente.
 */
import { isFixtureDue, isFixtureOpen } from './fixtureStatus'

export const CALENDAR_FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'APERTURA', label: 'Apertura' },
  { value: 'CLAUSURA', label: 'Clausura' },
  { value: 'TRANSFERS', label: 'Fichajes' },
  { value: 'MATCHES', label: 'Partidos' }
]

export const filterWeeks = (weeks, filter) =>
  weeks.filter(w => {
    switch (filter) {
      case 'APERTURA': return w.phase === 'REGULAR_SEASON_APERTURA'
      case 'CLAUSURA': return w.phase === 'REGULAR_SEASON_CLAUSURA'
      case 'TRANSFERS': return !!w.transferWindowOpen
      case 'MATCHES': return !!w.match
      default: return true
    }
  })

/** Partido del club que ya debería haberse jugado en la fecha actual y sigue abierto (bloquea el avance) */
export const findDueMatch = (weeks, currentDate) =>
  weeks.map(w => w.match).find(m => m && isFixtureOpen(m.status) && isFixtureDue(m.match_date, currentDate)) || null

/** Próximo partido por jugar (el primero abierto, esté vencido o no) */
export const findNextMatch = (weeks) => weeks.map(w => w.match).find(m => m && isFixtureOpen(m.status)) || null
