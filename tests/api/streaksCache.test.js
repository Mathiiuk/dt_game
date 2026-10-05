const state = { queries: 0 }

vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    q.select = () => q
    q.or = () => q
    q.in = () => q
    q.order = () => q
    q.limit = () => q
    q.then = (resolve) => {
      state.queries++
      resolve({
        data: [
          { id: 'f2', home_club_id: 'c1', away_club_id: 'x', home_score: 0, away_score: 1, match_date: '2026-09-08' },
          { id: 'f1', home_club_id: 'c1', away_club_id: 'y', home_score: 0, away_score: 2, match_date: '2026-09-01' }
        ],
        error: null
      })
    }
    return q
  }
  return { supabase: { from: chain } }
})

import { moraleApi } from '../../src/api/morale'
import { queryCache } from '../../src/utils/cache'

describe('rachas con caché corta', () => {
  beforeEach(() => { state.queries = 0; queryCache.clear() })

  it('pedidas tres veces seguidas (moral, clima y barra) hacen una sola consulta', async () => {
    const [a, b, c] = await Promise.all([moraleApi.getStreaks('c1'), moraleApi.getStreaks('c1'), moraleApi.getStreaks('c1')])
    expect(state.queries).toBe(1)
    expect(a.loss).toBe(2)
    expect(b).toEqual(a)
    expect(c.fixtureIds).toEqual(['f1', 'f2'])
  })

  it('distinto club o distinto largo no comparten caché', async () => {
    await moraleApi.getStreaks('c1')
    await moraleApi.getStreaks('c1', 5)
    await moraleApi.getStreaks('c2')
    expect(state.queries).toBe(3)
  })

  it('al consolidar un partido (se descarta la caché) se vuelve a leer', async () => {
    await moraleApi.getStreaks('c1')
    queryCache.clear()
    await moraleApi.getStreaks('c1')
    expect(state.queries).toBe(2)
  })
})
