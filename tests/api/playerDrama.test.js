// Pedido de salida: el aumento o el malestar del jugador los aplica la base
const state = { rpc: [], result: null }

vi.mock('../../src/api/morale', () => ({ moraleApi: { getStreaks: vi.fn(async () => ({})) } }))
vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    for (const m of ['select', 'eq', 'upsert', 'update', 'insert']) q[m] = () => q
    q.maybeSingle = async () => ({ data: null })
    q.single = async () => ({ data: { fans_confidence: 60, squad_morale: 60 } })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.result } } }
})

import { climateApi } from '../../src/api/climate'

describe('efectos sobre un jugador en un evento', () => {
  beforeEach(() => { state.rpc = [] })

  it('mejorarle el contrato llama a la base y cuenta el aumento', async () => {
    state.result = { data: { status: 'RAISED', wage: 140, previous_wage: 122 }, error: null }
    const note = await climateApi.applyEventEffects({ clubId: 'c1', effects: { action: 'RAISE_WAGE', player_id: 'p1', locker: -1 }, title: 'Pedido de salida' })
    expect(state.rpc).toEqual([{ fn: 'apply_player_drama', args: { p_club_id: 'c1', p_player_id: 'p1', p_action: 'RAISE_WAGE' } }])
    expect(note).toMatch(/de \$122 a \$140/)
  })

  it('plantarte deja al jugador con la cabeza en otro lado', async () => {
    state.result = { data: { status: 'UNHAPPY' }, error: null }
    const note = await climateApi.applyEventEffects({ clubId: 'c1', effects: { action: 'PLAYER_UNHAPPY', player_id: 'p1', fans: 2 }, title: 'Pedido de salida' })
    expect(state.rpc[0].args.p_action).toBe('UNHAPPY')
    expect(note).toMatch(/cabeza en otro lado/)
  })

  it('si la base falla no rompe la resolución del evento', async () => {
    state.result = { data: null, error: { message: 'boom' } }
    await expect(climateApi.applyEventEffects({ clubId: 'c1', effects: { action: 'RAISE_WAGE', player_id: 'p1' }, title: 'x' })).resolves.toBeNull()
  })

  it('un evento sin jugador no llama a la base', async () => {
    state.result = { data: null, error: null }
    await climateApi.applyEventEffects({ clubId: 'c1', effects: { fans: 1 }, title: 'x' })
    expect(state.rpc).toEqual([])
  })
})
