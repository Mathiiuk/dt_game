vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { competitionApi } from '../../src/api/competition'

describe('simulación de fechas de IA', () => {
  it('genera marcadores enteros no negativos y acotados', () => {
    for (let i = 0; i < 500; i++) {
      const { hGoals, aGoals } = competitionApi.simulateAiScore()
      expect(Number.isInteger(hGoals) && Number.isInteger(aGoals)).toBe(true)
      expect(hGoals).toBeGreaterThanOrEqual(0)
      expect(hGoals).toBeLessThanOrEqual(3)
      expect(aGoals).toBeGreaterThanOrEqual(0)
      expect(aGoals).toBeLessThanOrEqual(2)
    }
  })

  it('arma deltas de tabla coherentes (puntos, goles y forma) por club', () => {
    const deltas = competitionApi.buildStandingsDeltas([
      { competitionId: 'L', homeId: 'A', awayId: 'B', hGoals: 2, aGoals: 0 },
      { competitionId: 'L', homeId: 'C', awayId: 'A', hGoals: 1, aGoals: 1 }
    ])
    const by = Object.fromEntries(deltas.map(d => [d.club_id, d]))
    expect(by.A).toMatchObject({ played: 2, won: 1, drawn: 1, lost: 0, goals_for: 3, goals_against: 1, points: 4, form: 'E,V' })
    expect(by.B).toMatchObject({ played: 1, lost: 1, points: 0, goals_against: 2, form: 'D' })
    expect(by.C).toMatchObject({ played: 1, drawn: 1, points: 1, form: 'E' })
    // La suma de puntos nunca excede 3 por partido y los goles a favor igualan a los recibidos
    const totalFor = deltas.reduce((s, d) => s + d.goals_for, 0)
    const totalAgainst = deltas.reduce((s, d) => s + d.goals_against, 0)
    expect(totalFor).toBe(totalAgainst)
  })

  it('B2/liga: simula los partidos vencidos (<= fecha) y excluye al club del usuario', async () => {
    const calls = []
    const { supabase } = await import('../../src/api/supabase')
    const fixtures = [
      { id: 'f1', competition_id: 'L', home_team_id: 'A', away_team_id: 'B' },
      { id: 'f2', competition_id: 'L', home_team_id: 'USER', away_team_id: 'C' },
      { id: 'f3', competition_id: 'L', home_team_id: 'D', away_team_id: 'USER' }
    ]
    const chain = { select: () => chain, in: () => chain, lte: (col, val) => { calls.push(['lte', col, val]); return Promise.resolve({ data: fixtures }) } }
    supabase.from = () => chain
    supabase.rpc = vi.fn(async (name) => ({ data: name === 'batch_finish_fixtures' ? ['f1'] : 1, error: null }))

    const n = await competitionApi.simulateMatchDay('2026-08-12', 'USER')

    expect(n).toBe(1)
    expect(calls[0]).toEqual(['lte', 'match_date', '2026-08-12'])
    const finishRows = supabase.rpc.mock.calls.find(c => c[0] === 'batch_finish_fixtures')[1].rows
    expect(finishRows.map(r => r.id)).toEqual(['f1'])
    const standingsRows = supabase.rpc.mock.calls.find(c => c[0] === 'apply_standings_deltas')[1].rows
    expect(standingsRows.map(r => r.club_id).sort()).toEqual(['A', 'B'])
  })
})
