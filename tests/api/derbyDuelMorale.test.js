// El resultado del duelo mueve la moral del plantel, con tope, y nunca rompe el partido
const state = { players: [], batched: null, fail: false }
vi.mock('../../src/api/climate', () => ({ climateApi: { difficulty: { key: 'NORMAL' }, getState: vi.fn(), applySquadConsequence: vi.fn() } }))
vi.mock('../../src/api/finances', () => ({ financesApi: {} }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: vi.fn(async (rows) => { if (state.fail) throw new Error('boom'); state.batched = rows }) } }))
vi.mock('../../src/api/supabase', () => {
  const q = {}
  q.select = () => q
  q.eq = () => q
  q.then = (resolve) => resolve({ data: state.players, error: null })
  return { supabase: { from: () => q } }
})

import { pressApi } from '../../src/api/press'

describe('moral del plantel tras el duelo', () => {
  beforeEach(() => { state.players = [{ id: 'a', state_morale: 70 }, { id: 'b', state_morale: 99 }, { id: 'c', state_morale: 11 }]; state.batched = null; state.fail = false })

  it('ganar suma 3 con tope en 100', async () => {
    expect(await pressApi.applyDuelResult({ clubId: 'c1', result: 'WIN' })).toBe(3)
    expect(state.batched).toEqual([{ id: 'a', state_morale: 73 }, { id: 'b', state_morale: 100 }, { id: 'c', state_morale: 14 }])
  })

  it('perder resta 2 con piso en 10', async () => {
    expect(await pressApi.applyDuelResult({ clubId: 'c1', result: 'LOSE' })).toBe(-2)
    expect(state.batched).toEqual([{ id: 'a', state_morale: 68 }, { id: 'b', state_morale: 97 }, { id: 'c', state_morale: 10 }])
  })

  it('empatar no toca nada', async () => {
    expect(await pressApi.applyDuelResult({ clubId: 'c1', result: 'DRAW' })).toBe(0)
    expect(state.batched).toBeNull()
  })

  it('si la base falla no rompe: devuelve 0', async () => {
    state.fail = true
    expect(await pressApi.applyDuelResult({ clubId: 'c1', result: 'WIN' })).toBe(0)
  })
})
