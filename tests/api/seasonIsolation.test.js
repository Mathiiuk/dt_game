// Cierre de temporada: solo toca la liga del club (antes leía y reiniciaba las tablas de todas las ligas)
const state = { queries: [], writes: [], myCompetition: 'comp-A', table: [] }

vi.mock('../../src/api/calendar', () => ({ calendarApi: {} }))
vi.mock('../../src/api/playerEvolution', () => ({ playerEvolutionApi: { processAnnualEvolution: vi.fn(async () => {}) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _filters: {} }
    q.select = () => q
    q.eq = (k, v) => { q._filters[k] = v; return q }
    q.order = () => q
    q.limit = () => q
    q.insert = (row) => { state.writes.push({ table, op: 'insert', row }); return q }
    q.update = (row) => { state.writes.push({ table, op: 'update', row, filters: q._filters }); return q }
    q.single = async () => ({ data: table === 'clubs' ? { game_date: '2027-06-24', league_tier: 5 } : null })
    q.maybeSingle = async () => {
      state.queries.push({ table, filters: { ...q._filters } })
      if (table === 'standings') return { data: state.myCompetition ? { competition_id: state.myCompetition } : null }
      return { data: table === 'clubs' ? { game_date: '2027-06-24', league_tier: 5 } : null }
    }
    q.then = (resolve) => {
      state.queries.push({ table, filters: { ...q._filters } })
      return resolve({ data: table === 'standings' ? state.table : [], error: null })
    }
    return q
  }
  return { supabase: { from: chain } }
})

import { seasonCloseApi } from '../../src/api/seasonClose'

const standingsQueries = () => state.queries.filter(q => q.table === 'standings' && q.filters.competition_id)

describe('fin de temporada y ligas aisladas', () => {
  beforeEach(() => {
    state.queries = []
    state.writes = []
    state.myCompetition = 'comp-A'
    state.table = [{ id: 's1', club_id: 'rival1' }, { id: 's2', club_id: 'me' }, { id: 's3', club_id: 'rival2' }]
  })

  it('el cierre oficial lee la tabla de la liga del club y no la de todas', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: null, clubId: 'me', seasonYear: 2026 }).catch(() => {})
    const q = standingsQueries()
    expect(q.length).toBeGreaterThan(0)
    expect(q[0].filters.competition_id).toBe('comp-A')
  })

  it('el cierre oficial de un club sin liga no inventa un campeón con las tablas ajenas', async () => {
    state.myCompetition = null
    state.table = [{ id: 'x', club_id: 'otra-liga' }]
    const res = await seasonCloseApi.executeSeasonClose({ careerId: null, clubId: 'me', seasonYear: 2026 }).catch(() => null)
    expect(standingsQueries()).toEqual([])
    expect(JSON.stringify(res || {})).not.toContain('otra-liga')
  })
})
