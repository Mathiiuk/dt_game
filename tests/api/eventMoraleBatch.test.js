// La moral que mueve un evento se guarda para todo el plantel en un solo request (antes era uno por jugador)
const state = { event: null, playerUpdates: 0 }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { patch: null }
    for (const m of ['select', 'eq', 'order', 'limit', 'in', 'is', 'neq']) q[m] = () => q
    q.update = (row) => { q.patch = row; if (table === 'players') state.playerUpdates++; return q }
    q.insert = () => q
    q.single = async () => ({ data: table === 'dynamic_events' ? { ...state.event } : { id: 'c1', budget: 10000, board_confidence: 50, fans_confidence: 50 }, error: null })
    q.maybeSingle = q.single
    q.then = (resolve) => {
      if (table === 'players' && !q.patch) return resolve({ data: [{ id: 'p1', state_morale: 70 }, { id: 'p2', state_morale: 95 }, { id: 'p3', state_morale: 12 }], error: null })
      if (table === 'dynamic_events' && q.patch) return resolve({ data: [{ id: 'e1' }], error: null })
      return resolve({ data: [], error: null })
    }
    return q
  }
  return { supabase: { from: chain, rpc: async () => ({ data: { moved: true }, error: null }) } }
})
vi.mock('../../src/api/climate', () => ({ climateApi: { applyEventEffects: vi.fn(async () => null), onArcChapterResolved: vi.fn() } }))
vi.mock('../../src/api/reputation', () => ({ reputationApi: { applyReputationDelta: vi.fn(async () => ({})) } }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: vi.fn(async (rows) => rows.length) } }))

import { eventsApi } from '../../src/api/events'
import { playerApi } from '../../src/api/player'

describe('un evento que mueve la moral del plantel', () => {
  beforeEach(() => {
    state.event = { id: 'e1', club_id: 'c1', status: 'PENDING', title: 'Asado', options: [{ id: 'a', cost: 0, effects: { morale: 10 } }] }
    state.playerUpdates = 0
    vi.clearAllMocks()
  })

  it('guarda la moral de todo el plantel en un solo lote y respeta los topes', async () => {
    await eventsApi.resolveEvent('e1', { id: 'a' }, 'm1')
    expect(playerApi.batchUpdate).toHaveBeenCalledTimes(1)
    expect(playerApi.batchUpdate.mock.calls[0][0]).toEqual([
      { id: 'p1', state_morale: 80 },
      { id: 'p2', state_morale: 100 },
      { id: 'p3', state_morale: 22 }
    ])
    expect(state.playerUpdates).toBe(0)
  })

  it('un efecto negativo no baja la moral de 10', async () => {
    state.event.options[0].effects.morale = -20
    await eventsApi.resolveEvent('e1', { id: 'a' }, 'm1')
    expect(playerApi.batchUpdate.mock.calls[0][0].find(r => r.id === 'p3').state_morale).toBe(10)
  })
})
