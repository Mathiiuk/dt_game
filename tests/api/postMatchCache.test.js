vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('../../src/api/manager', () => ({ managerApi: {} }))
vi.mock('../../src/api/gameConfig', () => ({ gameConfigApi: {} }))
vi.mock('../../src/api/audit', () => ({ auditApi: {} }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: {} }))
vi.mock('../../src/api/achievements', () => ({ achievementsApi: {} }))

import { postMatchApi } from '../../src/api/postMatch'
import { queryCache } from '../../src/utils/cache'

describe('post-partido y caché', () => {
  it('al consolidar un partido se descarta la caché (Inicio no muestra el partido ya jugado)', async () => {
    queryCache.set('dashboard:overview:c1', { nextFixture: { id: 'f1' } }, 60000)
    queryCache.set('standings:c1', [1], 60000)
    postMatchApi._processResult = vi.fn(async () => ({ ok: true }))

    const res = await postMatchApi.processResult('m1', 'c1', { homeScore: 1, awayScore: 1 }, 'f1')

    expect(res).toEqual({ ok: true })
    expect(queryCache.get('dashboard:overview:c1')).toBeFalsy()
    expect(queryCache.get('standings:c1')).toBeFalsy()
  })

  it('también sin fixtureId y aunque se pida dos veces el mismo partido procesa una sola vez', async () => {
    queryCache.set('dashboard:overview:c1', { x: 1 }, 60000)
    let calls = 0
    postMatchApi._processResult = vi.fn(async () => { calls++; return { ok: calls } })
    const [a, b] = await Promise.all([
      postMatchApi.processResult('m1', 'c1', {}, 'f2'),
      postMatchApi.processResult('m1', 'c1', {}, 'f2')
    ])
    expect(a).toBe(b)
    expect(calls).toBe(1)
    expect(queryCache.get('dashboard:overview:c1')).toBeFalsy()
  })
})
