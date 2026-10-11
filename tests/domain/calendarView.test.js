import { filterWeeks, findDueMatch, findNextMatch, getUpcomingMatches, getRecentResults, groupWeeksByMonth } from '../../src/domain/calendarView'

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

  it('filtra por partidos de local y de visitante', () => {
    const customWeeks = [
      { weekNumber: 1, match: { is_home: true, home_club_id: 'c1', away_club_id: 'c2' } },
      { weekNumber: 2, match: { is_home: false, home_club_id: 'c3', away_club_id: 'c1' } },
      { weekNumber: 3, match: null }
    ]
    expect(filterWeeks(customWeeks, 'HOME', 'c1').map(w => w.weekNumber)).toEqual([1])
    expect(filterWeeks(customWeeks, 'AWAY', 'c1').map(w => w.weekNumber)).toEqual([2])
  })

  it('obtiene los próximos partidos abiertos y los resultados recientes', () => {
    const list = [
      { weekNumber: 1, date: '2026-07-01', match: { status: 'FINISHED', home_score: 2, away_score: 1 } },
      { weekNumber: 2, date: '2026-07-08', match: { status: 'SCHEDULED' } },
      { weekNumber: 3, date: '2026-07-15', match: { status: 'SCHEDULED' } }
    ]
    expect(getUpcomingMatches(list, 2)).toHaveLength(2)
    expect(getRecentResults(list, 2)).toHaveLength(1)
  })

  it('agrupa las semanas por mes', () => {
    const list = [
      { weekNumber: 1, date: '2026-07-01' },
      { weekNumber: 2, date: '2026-07-08' },
      { weekNumber: 5, date: '2026-08-01' }
    ]
    const groups = groupWeeksByMonth(list)
    expect(groups).toHaveLength(2)
    expect(groups[0].label).toBe('Julio 2026')
    expect(groups[0].weeks).toHaveLength(2)
    expect(groups[1].label).toBe('Agosto 2026')
    expect(groups[1].weeks).toHaveLength(1)
  })
})

import { weekItemView, OUTCOME_LABEL } from '../../src/domain/calendarView'

describe('fila de una semana del calendario', () => {
  const week = (match) => ({ weekNumber: 4, match })

  it('una semana sin partido no tiene rival ni resultado', () => {
    expect(weekItemView(week(null), 'c1')).toEqual({ hasMatch: false })
  })

  it('de local o visitante, según el partido o el club', () => {
    expect(weekItemView(week({ is_home: true, opponent_name: 'Bella Vista', status: 'SCHEDULED' }), 'c1')).toMatchObject({ isHome: true, opponent: 'Bella Vista', played: false, outcome: null, score: null })
    expect(weekItemView(week({ home_club_id: 'x', away_club_id: 'c1', status: 'SCHEDULED' }), 'c1')).toMatchObject({ isHome: false, opponent: 'Rival' })
  })

  it('el resultado se cuenta desde el club propio, jugando de local o de visitante', () => {
    const home = weekItemView(week({ is_home: true, status: 'COMPLETED', home_score: 3, away_score: 1 }), 'c1')
    expect(home).toMatchObject({ score: '3 - 1', outcome: 'win', played: true })
    const away = weekItemView(week({ is_home: false, status: 'COMPLETED', home_score: 3, away_score: 1 }), 'c1')
    expect(away).toMatchObject({ score: '1 - 3', outcome: 'loss' })
    expect(weekItemView(week({ is_home: false, status: 'COMPLETED', home_score: 2, away_score: 2 }), 'c1')).toMatchObject({ score: '2 - 2', outcome: 'draw' })
  })

  it('jugado pero sin marcador cargado: no inventa resultado', () => {
    expect(weekItemView(week({ is_home: true, status: 'COMPLETED', home_score: null, away_score: null }), 'c1')).toMatchObject({ played: true, hasScore: false, score: null, outcome: null })
  })

  it('las etiquetas del resultado', () => {
    expect(OUTCOME_LABEL).toEqual({ win: 'Victoria', draw: 'Empate', loss: 'Derrota' })
  })
})
