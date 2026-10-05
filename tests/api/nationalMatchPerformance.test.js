const log = []
const state = { played: false }
const callups = Array.from({ length: 23 }, (_, i) => ({ id: `cu${i}`, player_id: `p${i}`, caps: i }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { table }
    q.select = () => q
    q.eq = () => q
    q.in = () => q
    q.update = (payload) => { log.push({ table, op: 'update', payload }); return q }
    q.single = async () => ({ data: table === 'national_fixtures' ? { id: 'f1', is_home: true, played: state.played, opponent_name: 'Chile' } : table === 'national_teams' ? { matches_played: 0, matches_won: 0, matches_drawn: 0, matches_lost: 0, category: 'senior' } : table === 'managers' ? { personal_savings: 0 } : null, error: null })
    q.then = (resolve) => resolve({ data: table === 'national_team_callups' ? callups : table === 'players' ? callups.map(c => ({ id: c.player_id, state_fitness: 90 })) : [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: vi.fn(async (fn, args) => { log.push({ table: 'rpc', op: fn, payload: args }); return { data: args.rows.length, error: null } }) } }
})
vi.mock('../../src/api/manager', () => ({ managerApi: { addXp: vi.fn(async () => {}) } }))
vi.mock('../../src/api/reputation', () => ({ reputationApi: { applyReputationDelta: vi.fn(async () => {}) } }))

import { nationalTeamApi } from '../../src/api/nationalTeam'

describe('fecha FIFA: rendimiento e idempotencia', () => {
  beforeEach(() => { log.length = 0; state.played = false })

  it('la fatiga de los 23 convocados se aplica en UNA llamada y los caps en paralelo (sin un select por jugador)', async () => {
    await nationalTeamApi.playMatch('f1', 't1', 'm1')
    const fatigue = log.filter(l => l.table === 'rpc' && l.op === 'batch_update_players')
    expect(fatigue).toHaveLength(1)
    expect(fatigue[0].payload.rows).toHaveLength(23)
    expect(fatigue[0].payload.rows[0].state_fitness).toBe(75)
    expect(log.filter(l => l.table === 'national_team_callups' && l.op === 'update')).toHaveLength(23)
    expect(log.filter(l => l.table === 'players' && l.op === 'update')).toEqual([])
  })

  it('una fecha ya jugada no se vuelve a jugar', async () => {
    state.played = true
    await expect(nationalTeamApi.playMatch('f1', 't1', 'm1')).rejects.toThrow('ya fue disputada')
    expect(log).toEqual([])
  })
})
