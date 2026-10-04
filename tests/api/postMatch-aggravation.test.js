// Lesionados que jugaron: si empeoran, la lesión activa se alarga (+2 semanas) y el jugador queda más días de baja
const calls = { rpc: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.order = () => q
    q.limit = () => q
    q.maybeSingle = () => Promise.resolve({ data: { id: 'inj1', weeks_remaining: 3, weeks_total: 4 }, error: null })
    return q
  }
  return {
    supabase: {
      from: () => chain(),
      rpc: (name, args) => { calls.rpc.push([name, args]); return Promise.resolve({ data: 1, error: null }) }
    }
  }
})
vi.mock('../../src/api/manager', () => ({ managerApi: {} }))
vi.mock('../../src/api/gameConfig', () => ({ gameConfigApi: {} }))
vi.mock('../../src/api/audit', () => ({ auditApi: {} }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: {} }))
vi.mock('../../src/api/achievements', () => ({ achievementsApi: {} }))

import { postMatchApi } from '../../src/api/postMatch'

describe('agravamiento de lesiones tras jugar lesionado', () => {
  beforeEach(() => { calls.rpc = [] })

  it('alarga la lesión activa 2 semanas y actualiza los días de baja del jugador', async () => {
    await postMatchApi._applyAggravations('club1', ['p1'])

    const injuryCall = calls.rpc.find(c => c[0] === 'batch_update_injuries')
    expect(injuryCall[1].rows).toEqual([{ id: 'inj1', weeks_remaining: 5, is_cleared: false }])

    const playerCall = calls.rpc.find(c => c[0] === 'batch_update_players')
    expect(playerCall[1].rows).toEqual([{ id: 'p1', injury_days: 35 }])
  })

  it('sin jugadores que agraven no hace ninguna llamada', async () => {
    await postMatchApi._applyAggravations('club1', [])
    expect(calls.rpc).toEqual([])
  })
})
