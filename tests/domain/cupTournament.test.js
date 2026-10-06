import {
  cupSchedule, firstWednesdayOnOrAfter, qualifiedClubIds, quarterPairs, planTournamentStep, dueUserFixture, isDue, cupSeasonYear,
  matchDateOf, tiesOf, tieAggregate, tieWinner, winnerOf, LEGS_PER_STAGE
} from '../../src/domain/cupTournament'

const schedule = cupSchedule(2026)
const fx = (stage, n, home, away, extra = {}) => ({ id: `${stage}${n}${extra.leg === 2 ? 'v' : ''}`, stage, match_number: n, leg: 1, home_club_id: home, away_club_id: away, match_date: schedule[stage], played: false, ...extra })
// Un cruce de ida y vuelta ya jugado: gana `winner` (se escribe como lo hace el servidor)
const playedTie = (stage, n, a, b, winner, scores = [[1, 0], [0, 1]]) => [
  fx(stage, n, a, b, { leg: 1, played: true, home_score: scores[0][0], away_score: scores[0][1] }),
  fx(stage, n, b, a, { leg: 2, played: true, home_score: scores[1][0], away_score: scores[1][1], match_date: schedule[`${stage}_leg2`], winner_club_id: winner })
]

describe('calendario de la copa', () => {
  it('cuartos y semifinales a mitad de semana con vuelta una semana después, final un sábado, todo en orden', () => {
    expect(schedule.quarter_finals).toBe('2026-09-16')
    expect(schedule.quarter_finals_leg2).toBe('2026-09-23')
    expect(new Date(`${schedule.quarter_finals}T00:00:00Z`).getUTCDay()).toBe(3)
    expect(schedule.semi_finals).toBe('2026-10-21')
    expect(schedule.semi_finals_leg2).toBe('2026-10-28')
    expect(new Date(`${schedule.semi_finals_leg2}T00:00:00Z`).getUTCDay()).toBe(3)
    expect(schedule.final).toBe('2026-11-21')
    expect(new Date(`${schedule.final}T00:00:00Z`).getUTCDay()).toBe(6)
    expect(schedule.seedDate).toBe('2026-09-01')
  })
  it('la vuelta se juega siempre después de la ida y antes de la siguiente fase', () => {
    expect(schedule.quarter_finals_leg2 > schedule.quarter_finals).toBe(true)
    expect(schedule.semi_finals > schedule.quarter_finals_leg2).toBe(true)
    expect(schedule.final > schedule.semi_finals_leg2).toBe(true)
  })
  it('fecha de cada partido según la fase y si es ida o vuelta', () => {
    expect(matchDateOf(schedule, 'quarter_finals', 1)).toBe('2026-09-16')
    expect(matchDateOf(schedule, 'quarter_finals', 2)).toBe('2026-09-23')
    expect(matchDateOf(schedule, 'final', 1)).toBe('2026-11-21')
    expect(LEGS_PER_STAGE).toEqual({ quarter_finals: 2, semi_finals: 2, final: 1 })
  })
  it('primer miércoles en o después de una fecha', () => {
    expect(firstWednesdayOnOrAfter('2026-09-16')).toBe('2026-09-16')
    expect(firstWednesdayOnOrAfter('2026-09-17')).toBe('2026-09-23')
  })
  it('temporada de una fecha (arranca en julio)', () => {
    expect(cupSeasonYear('2026-07-01')).toBe(2026)
    expect(cupSeasonYear('2027-02-01')).toBe(2026)
  })
})

describe('clasificación y cruces', () => {
  it('clasifican los 8 mejores por puntos, diferencia y goles a favor', () => {
    const table = Array.from({ length: 12 }, (_, i) => ({ club_id: `c${i}`, points: 30 - i, goals_for: 10, goals_against: 5 }))
    table.push({ club_id: 'empate', points: 23, goals_for: 20, goals_against: 5 }) // mismos puntos que c7, mejor diferencia
    const ids = qualifiedClubIds(table)
    expect(ids).toHaveLength(8)
    expect(ids.indexOf('empate')).toBeLessThan(ids.indexOf('c7') === -1 ? 99 : ids.indexOf('c7'))
    expect(ids[0]).toBe('c0')
  })
  it('cuartos: 1º-8º, 4º-5º, 3º-6º, 2º-7º', () => {
    expect(quarterPairs(['1', '2', '3', '4', '5', '6', '7', '8'])).toEqual([['1', '8'], ['4', '5'], ['3', '6'], ['2', '7']])
  })
})

describe('cruces de ida y vuelta', () => {
  it('agrupa la ida y la vuelta de cada cruce, en orden', () => {
    const fixtures = [fx('quarter_finals', 2, 'b', 'c', { leg: 2 }), fx('quarter_finals', 1, 'me', 'a'), fx('quarter_finals', 2, 'c', 'b'), fx('quarter_finals', 1, 'a', 'me', { leg: 2 })]
    const ties = tiesOf(fixtures, 'quarter_finals')
    expect(ties.map(t => t.matchNumber)).toEqual([1, 2])
    expect(ties[0].legs.map(l => l.leg)).toEqual([1, 2])
  })

  it('el global suma los goles de cada club en los dos partidos', () => {
    const [ida, vuelta] = playedTie('semi_finals', 1, 'a', 'b', 'a', [[2, 1], [0, 1]])
    // a: 2 de local + 1 de visitante; b: 1 de visitante + 0 de local
    expect(tieAggregate([ida, vuelta])).toEqual({ a: 3, b: 1 })
  })

  it('el cruce se decide recién cuando se jugaron los dos partidos, con el ganador que escribe el servidor', () => {
    const [ida, vuelta] = playedTie('quarter_finals', 1, 'a', 'b', 'b', [[2, 0], [3, 0]])
    expect(tieWinner([ida, { ...vuelta, played: false, winner_club_id: null }])).toBeNull()
    expect(tieWinner([ida, { ...vuelta, played: false }])).toBeNull()
    // Aunque en el global ganara 'a' por goles de visitante, manda lo que decidió el servidor (penales)
    expect(tieWinner([ida, vuelta])).toBe('b')
    expect(winnerOf({ home_club_id: 'x', away_club_id: 'y', home_score: 1, away_score: 0 })).toBe('x')
    expect(winnerOf({ home_club_id: 'x', away_club_id: 'y', home_score: 1, away_score: 0, winner_club_id: 'y' })).toBe('y')
  })
})

describe('un paso del torneo según la fecha', () => {
  const quarters = [
    fx('quarter_finals', 1, 'me', 'a'), fx('quarter_finals', 1, 'a', 'me', { leg: 2, match_date: schedule.quarter_finals_leg2 }),
    fx('quarter_finals', 2, 'b', 'c'), fx('quarter_finals', 2, 'c', 'b', { leg: 2, match_date: schedule.quarter_finals_leg2 }),
    fx('quarter_finals', 3, 'd', 'e'), fx('quarter_finals', 3, 'e', 'd', { leg: 2, match_date: schedule.quarter_finals_leg2 }),
    fx('quarter_finals', 4, 'f', 'g'), fx('quarter_finals', 4, 'g', 'f', { leg: 2, match_date: schedule.quarter_finals_leg2 })
  ]

  it('antes de la fecha no hay nada para simular y el partido propio no está vencido', () => {
    const plan = planTournamentStep({ fixtures: quarters, gameDate: '2026-09-09', userClubId: 'me', schedule })
    expect(plan.toSimulate).toEqual([])
    expect(dueUserFixture(quarters, '2026-09-09', 'me')).toBeNull()
  })

  it('en la fecha de la ida se simulan las de IA y la del usuario espera; la vuelta todavía no está vencida', () => {
    const plan = planTournamentStep({ fixtures: quarters, gameDate: '2026-09-16', userClubId: 'me', schedule })
    expect(plan.toSimulate.map(f => f.id)).toEqual(['quarter_finals2', 'quarter_finals3', 'quarter_finals4'])
    expect(dueUserFixture(quarters, '2026-09-16', 'me').id).toBe('quarter_finals1')
    expect(plan.toCreate).toEqual([])
  })

  it('si pasaron las dos fechas, el usuario debe jugar primero la ida y después la vuelta', () => {
    expect(dueUserFixture(quarters, '2026-09-30', 'me').id).toBe('quarter_finals1')
    const afterFirst = quarters.map(f => (f.id === 'quarter_finals1' ? { ...f, played: true, home_score: 1, away_score: 0 } : f))
    expect(dueUserFixture(afterFirst, '2026-09-30', 'me').id).toBe('quarter_finals1v')
  })

  it('con las ocho partidos jugados se crean las semifinales de ida y vuelta, con la localía invertida y una sola vez', () => {
    const played = [
      ...playedTie('quarter_finals', 1, 'me', 'a', 'a'),
      ...playedTie('quarter_finals', 2, 'b', 'c', 'b'),
      ...playedTie('quarter_finals', 3, 'd', 'e', 'd'),
      ...playedTie('quarter_finals', 4, 'f', 'g', 'f')
    ]
    const plan = planTournamentStep({ fixtures: played, gameDate: '2026-09-30', userClubId: 'me', schedule })
    expect(plan.toCreate).toEqual([
      { stage: 'semi_finals', match_number: 1, leg: 1, home_club_id: 'a', away_club_id: 'b', match_date: '2026-10-21' },
      { stage: 'semi_finals', match_number: 1, leg: 2, home_club_id: 'b', away_club_id: 'a', match_date: '2026-10-28' },
      { stage: 'semi_finals', match_number: 2, leg: 1, home_club_id: 'd', away_club_id: 'f', match_date: '2026-10-21' },
      { stage: 'semi_finals', match_number: 2, leg: 2, home_club_id: 'f', away_club_id: 'd', match_date: '2026-10-28' }
    ])
    const again = planTournamentStep({ fixtures: [...played, fx('semi_finals', 1, 'a', 'b')], gameDate: '2026-09-30', userClubId: 'me', schedule })
    expect(again.toCreate).toEqual([])
  })

  it('con un cruce a medias no se crea la fase siguiente', () => {
    const partial = [
      ...playedTie('quarter_finals', 1, 'me', 'a', 'a'),
      ...playedTie('quarter_finals', 2, 'b', 'c', 'b'),
      ...playedTie('quarter_finals', 3, 'd', 'e', 'd'),
      fx('quarter_finals', 4, 'f', 'g', { played: true, home_score: 1, away_score: 0 }),
      fx('quarter_finals', 4, 'g', 'f', { leg: 2, match_date: schedule.quarter_finals_leg2 })
    ]
    expect(planTournamentStep({ fixtures: partial, gameDate: '2026-09-30', userClubId: 'me', schedule }).toCreate).toEqual([])
  })

  it('la final es a partido único y al jugarse hay campeón', () => {
    const quartersDone = [
      ...playedTie('quarter_finals', 1, 'me', 'a', 'a'), ...playedTie('quarter_finals', 2, 'b', 'c', 'b'),
      ...playedTie('quarter_finals', 3, 'd', 'e', 'd'), ...playedTie('quarter_finals', 4, 'f', 'g', 'f')
    ]
    const semisDone = [...playedTie('semi_finals', 1, 'a', 'b', 'a'), ...playedTie('semi_finals', 2, 'd', 'f', 'f')]
    const plan = planTournamentStep({ fixtures: [...quartersDone, ...semisDone], gameDate: '2026-11-04', userClubId: 'me', schedule })
    expect(plan.toCreate).toEqual([{ stage: 'final', match_number: 1, leg: 1, home_club_id: 'a', away_club_id: 'f', match_date: '2026-11-21' }])
    const final = fx('final', 1, 'a', 'f', { played: true, home_score: 0, away_score: 1, winner_club_id: 'f' })
    expect(planTournamentStep({ fixtures: [...quartersDone, ...semisDone, final], gameDate: '2026-11-21', userClubId: 'me', schedule }).championId).toBe('f')
  })

  it('isDue compara sólo la fecha', () => {
    expect(isDue({ played: false, match_date: '2026-09-16' }, '2026-09-16')).toBe(true)
    expect(isDue({ played: false, match_date: '2026-09-16' }, '2026-09-09')).toBe(false)
    expect(isDue({ played: true, match_date: '2026-09-16' }, '2026-09-30')).toBe(false)
  })
})
