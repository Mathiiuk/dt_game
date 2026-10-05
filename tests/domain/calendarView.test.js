import { filterWeeks, findDueMatch, findNextMatch } from '../../src/domain/calendarView'

const weeks = [
  { weekNumber: 1, phase: 'PRE_SEASON', transferWindowOpen: true, match: null },
  { weekNumber: 3, phase: 'REGULAR_SEASON_APERTURA', transferWindowOpen: false, match: { status: 'PLAYED', match_date: '2026-07-15' } },
  { weekNumber: 5, phase: 'REGULAR_SEASON_APERTURA', transferWindowOpen: false, match: { status: 'SCHEDULED', match_date: '2026-07-29' } },
  { weekNumber: 26, phase: 'REGULAR_SEASON_CLAUSURA', transferWindowOpen: false, match: { status: 'SCHEDULED', match_date: '2026-12-30' } }
]

describe('vista del calendario', () => {
  it('filtra por fase, mercado y partidos', () => {
    expect(filterWeeks(weeks, 'ALL')).toHaveLength(4)
    expect(filterWeeks(weeks, 'APERTURA').map(w => w.weekNumber)).toEqual([3, 5])
    expect(filterWeeks(weeks, 'CLAUSURA').map(w => w.weekNumber)).toEqual([26])
    expect(filterWeeks(weeks, 'TRANSFERS').map(w => w.weekNumber)).toEqual([1])
    expect(filterWeeks(weeks, 'MATCHES')).toHaveLength(3)
  })

  it('detecta el partido vencido que bloquea el avance (y no uno futuro)', () => {
    expect(findDueMatch(weeks, '2026-07-22')).toBeNull()
    expect(findDueMatch(weeks, '2026-07-29').match_date).toBe('2026-07-29')
    expect(findDueMatch(weeks, '2026-08-05').match_date).toBe('2026-07-29')
  })

  it('el próximo partido es el primero abierto', () => {
    expect(findNextMatch(weeks).match_date).toBe('2026-07-29')
  })
})
