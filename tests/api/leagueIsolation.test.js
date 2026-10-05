// Mock de supabase con tablas en memoria y un contador de inserciones en clubs
const db = { standings: [], clubsInserted: 0, filters: [] }

vi.mock('../../src/api/supabase', () => {
  const builder = (table) => {
    const state = { table, filters: [], op: 'select' }
    const run = async () => {
      if (state.op === 'insert') {
        if (table === 'clubs') { db.clubsInserted += state.payload.length; return { data: state.payload.map((_, i) => ({ id: `ai-${db.clubsInserted}-${i}` })), error: null } }
        if (table === 'competitions') return { data: { id: 'comp-1' }, error: null }
        if (table === 'standings') { db.standings.push(...state.payload); return { data: null, error: null } }
        return { data: null, error: null }
      }
      if (table === 'standings') {
        let rows = db.standings
        for (const [k, v] of state.filters) rows = rows.filter(r => r[k] === v)
        return { data: rows, error: null }
      }
      db.filters.push(state.filters)
      return { data: [], error: null }
    }
    const b = {
      select: () => b,
      insert: (payload) => { state.op = 'insert'; state.payload = Array.isArray(payload) ? payload : [payload]; return b },
      eq: (k, v) => { state.filters.push([k, v]); return b },
      or: (expr) => { state.filters.push(['or', expr]); return b },
      is: (k, v) => { state.filters.push([`is:${k}`, v]); return b },
      limit: () => b,
      single: async () => { const r = await run(); return { data: Array.isArray(r.data) ? r.data[0] : r.data, error: r.error } },
      maybeSingle: async () => { const r = await run(); return { data: Array.isArray(r.data) ? r.data[0] || null : r.data, error: r.error } },
      then: (res, rej) => run().then(res, rej)
    }
    return b
  }
  return { supabase: { from: builder } }
})

import { competitionApi } from '../../src/api/competition'
import { marketApi } from '../../src/api/market'

describe('liga aislada por carrera', () => {
  beforeEach(() => { db.standings = []; db.clubsInserted = 0; db.filters = [] })

  it('llamadas simultáneas a initializeLeague crean la liga una sola vez (sin rivales duplicados)', async () => {
    const [a, b, c] = await Promise.all([
      competitionApi.initializeLeague('club-1'),
      competitionApi.initializeLeague('club-1'),
      competitionApi.initializeLeague('club-1')
    ])
    expect(a).toBe(b)
    expect(b).toBe(c)
    expect(db.clubsInserted).toBe(19)
  })

  it('el mercado sólo incluye a los clubes de la liga del usuario (sin el propio) y a los agentes libres', async () => {
    db.standings = [
      { competition_id: 'k1', club_id: 'me' }, { competition_id: 'k1', club_id: 'r1' }, { competition_id: 'k1', club_id: 'r2' },
      { competition_id: 'k2', club_id: 'otra-carrera' }
    ]
    expect(await marketApi.getLeagueClubIds('me')).toEqual(['r1', 'r2'])
    expect(await marketApi.getLeagueClubIds('sin-liga')).toEqual([])
  })
})
