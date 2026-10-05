// Recuperación semanal de lesiones: devuelve un resumen (antes lanzaba un error por una variable inexistente)
const state = { injuries: [], rpcs: [], players: [] }

vi.mock('../../src/api/staff', () => ({ staffApi: { getStaff: async () => [] } }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: vi.fn(async (rows) => { state.players.push(rows) }) } }))
vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.then = (resolve) => resolve({ data: state.injuries, error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (name, args) => { state.rpcs.push({ name, args }); return { error: null } } } }
})

import { injuriesApi } from '../../src/api/injuries'

describe('recuperación semanal de lesiones', () => {
  beforeEach(() => {
    state.rpcs = []
    state.players = []
    state.injuries = [
      { id: 'i1', player_id: 'a', weeks_remaining: 1 },
      { id: 'i2', player_id: 'b', weeks_remaining: 4 }
    ]
  })

  it('da el alta a quien llega a cero y descuenta una semana al resto, y devuelve el resumen', async () => {
    const res = await injuriesApi.processWeeklyInjuriesRecovery('c1')
    expect(res).toEqual({ recovered: 1, ongoing: 1 })
    expect(state.rpcs[0].args.rows).toEqual([
      { id: 'i1', weeks_remaining: 0, is_cleared: true },
      { id: 'i2', weeks_remaining: 3, is_cleared: false }
    ])
    expect(state.players[0]).toEqual([
      { id: 'a', is_injured: false, injury_days: 0, injury_type: null, state_fitness: 70 },
      { id: 'b', injury_days: 21 }
    ])
  })

  it('con escritura diferida devuelve los cambios de los jugadores sin guardarlos', async () => {
    const res = await injuriesApi.processWeeklyInjuriesRecovery('c1', { deferPlayerWrite: true })
    expect(state.players).toEqual([])
    expect(state.rpcs).toHaveLength(1)
    expect(res.recovered).toBe(1)
    expect(res.playerUpdates.map(u => u.id)).toEqual(['a', 'b'])
  })

  it('sin lesionados o sin club no hace nada', async () => {
    state.injuries = []
    expect(await injuriesApi.processWeeklyInjuriesRecovery('c1')).toEqual({ recovered: 0, ongoing: 0 })
    expect(await injuriesApi.processWeeklyInjuriesRecovery(null)).toEqual({ recovered: 0, ongoing: 0 })
    expect(state.rpcs).toEqual([])
  })
})
