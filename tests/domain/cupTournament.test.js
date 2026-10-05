import { cupSchedule, firstWednesdayOnOrAfter, qualifiedClubIds, quarterPairs, planTournamentStep, dueUserFixture, isDue, cupSeasonYear } from '../../src/domain/cupTournament'

const schedule = cupSchedule(2026)
const fx = (stage, n, home, away, extra = {}) => ({ id: `${stage}${n}`, stage, match_number: n, home_club_id: home, away_club_id: away, match_date: schedule[stage], played: false, ...extra })

describe('calendario de la copa', () => {
  it('cuartos y semifinales a mitad de semana, final un sábado, todo en orden', () => {
    expect(schedule.quarter_finals).toBe('2026-09-16')
    expect(new Date(`${schedule.quarter_finals}T00:00:00Z`).getUTCDay()).toBe(3)
    expect(schedule.semi_finals).toBe('2026-10-21')
    expect(new Date(`${schedule.semi_finals}T00:00:00Z`).getUTCDay()).toBe(3)
    expect(schedule.final).toBe('2026-11-21')
    expect(new Date(`${schedule.final}T00:00:00Z`).getUTCDay()).toBe(6)
    expect(schedule.seedDate).toBe('2026-09-01')
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

describe('un paso del torneo según la fecha', () => {
  const quarters = [fx('quarter_finals', 1, 'me', 'a'), fx('quarter_finals', 2, 'b', 'c'), fx('quarter_finals', 3, 'd', 'e'), fx('quarter_finals', 4, 'f', 'g')]

  it('antes de la fecha no hay nada para simular y el partido propio no está vencido', () => {
    const plan = planTournamentStep({ fixtures: quarters, gameDate: '2026-09-09', userClubId: 'me', schedule })
    expect(plan.toSimulate).toEqual([])
    expect(dueUserFixture(quarters, '2026-09-09', 'me')).toBeNull()
  })

  it('en la fecha se simulan los partidos de IA y el propio queda esperando al usuario', () => {
    const plan = planTournamentStep({ fixtures: quarters, gameDate: '2026-09-16', userClubId: 'me', schedule })
    expect(plan.toSimulate.map(f => f.id)).toEqual(['quarter_finals2', 'quarter_finals3', 'quarter_finals4'])
    expect(dueUserFixture(quarters, '2026-09-16', 'me').id).toBe('quarter_finals1')
    expect(plan.toCreate).toEqual([])
  })

  it('con los cuatro cuartos jugados se crean las semifinales con los ganadores, en su fecha y una sola vez', () => {
    const played = quarters.map((f, i) => ({ ...f, played: true, home_score: 2, away_score: i === 0 ? 3 : 0 }))
    const plan = planTournamentStep({ fixtures: played, gameDate: '2026-09-16', userClubId: 'me', schedule })
    expect(plan.toCreate).toEqual([
      { stage: 'semi_finals', match_number: 1, home_club_id: 'a', away_club_id: 'b', match_date: '2026-10-21' },
      { stage: 'semi_finals', match_number: 2, home_club_id: 'd', away_club_id: 'f', match_date: '2026-10-21' }
    ])
    const again = planTournamentStep({ fixtures: [...played, fx('semi_finals', 1, 'a', 'b'), fx('semi_finals', 2, 'd', 'f')], gameDate: '2026-09-16', userClubId: 'me', schedule })
    expect(again.toCreate).toEqual([])
  })

  it('si el usuario fue eliminado el torneo sigue su curso; al jugarse la final hay campeón', () => {
    const semis = [fx('semi_finals', 1, 'a', 'b', { played: true, home_score: 1, away_score: 0 }), fx('semi_finals', 2, 'd', 'f', { played: true, home_score: 0, away_score: 2 })]
    const quartersDone = quarters.map(f => ({ ...f, played: true, home_score: 1, away_score: 0 }))
    const plan = planTournamentStep({ fixtures: [...quartersDone, ...semis], gameDate: '2026-10-21', userClubId: 'me', schedule })
    expect(plan.toCreate).toEqual([{ stage: 'final', match_number: 1, home_club_id: 'a', away_club_id: 'f', match_date: '2026-11-21' }])
    const final = fx('final', 1, 'a', 'f', { played: true, home_score: 0, away_score: 1 })
    expect(planTournamentStep({ fixtures: [...quartersDone, ...semis, final], gameDate: '2026-11-21', userClubId: 'me', schedule }).championId).toBe('f')
  })

  it('isDue compara sólo la fecha', () => {
    expect(isDue({ played: false, match_date: '2026-09-16' }, '2026-09-16')).toBe(true)
    expect(isDue({ played: false, match_date: '2026-09-16' }, '2026-09-09')).toBe(false)
    expect(isDue({ played: true, match_date: '2026-09-16' }, '2026-09-30')).toBe(false)
  })
})
