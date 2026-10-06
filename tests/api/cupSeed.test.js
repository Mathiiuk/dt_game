// Sorteo de la copa: los cuartos salen de ida y vuelta, con la localía invertida
const state = { inserted: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.single = async () => ({ data: table === 'international_tournaments' ? { id: 't1' } : null, error: null })
    q.eq = () => q
    q.update = () => q
    q.insert = (rows) => { state.inserted.push({ table, rows }); return q }
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { internationalCupApi } from '../../src/api/internationalCup'
import { cupSchedule } from '../../src/domain/cupTournament'

describe('sorteo de la copa', () => {
  it('crea los cuartos de ida y vuelta con la localía invertida y cada partido en su fecha', async () => {
    const standings = Array.from({ length: 8 }, (_, i) => ({ club_id: `c${i + 1}`, points: 30 - i, goals_for: 10, goals_against: 5 }))
    vi.spyOn(internationalCupApi, 'getLeagueStandings').mockResolvedValue(standings)
    const schedule = cupSchedule(2026)
    await internationalCupApi.seedTournament(2026, 'c1', schedule)

    const fixtures = state.inserted.find(i => i.table === 'international_fixtures').rows
    expect(fixtures).toHaveLength(8)
    const first = fixtures.filter(f => f.match_number === 1)
    expect(first.map(f => [f.leg, f.home_club_id, f.away_club_id, f.match_date])).toEqual([
      [1, 'c1', 'c8', '2026-09-16'],
      [2, 'c8', 'c1', '2026-09-23']
    ])
    expect(fixtures.every(f => f.stage === 'quarter_finals' && f.tournament_id === 't1')).toBe(true)
    expect(new Set(fixtures.map(f => f.match_number)).size).toBe(4)
  })

  it('sin ocho clasificados no hay torneo', async () => {
    vi.spyOn(internationalCupApi, 'getLeagueStandings').mockResolvedValue([{ club_id: 'c1', points: 3 }])
    state.inserted = []
    expect(await internationalCupApi.seedTournament(2026, 'c1')).toBeNull()
    expect(state.inserted).toEqual([])
  })
})
