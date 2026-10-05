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

import { gameLoopApi } from '../../src/api/gameLoop'
import { seasonCloseApi } from '../../src/api/seasonClose'

const standingsQueries = () => state.queries.filter(q => q.table === 'standings' && q.filters.competition_id)

describe('fin de temporada y ligas aisladas', () => {
  beforeEach(() => {
    state.queries = []
    state.writes = []
    state.myCompetition = 'comp-A'
    state.table = [{ id: 's1', club_id: 'rival1' }, { id: 's2', club_id: 'me' }, { id: 's3', club_id: 'rival2' }]
  })

  it('el historial usa la temporada del club y su puesto real (no el año del navegador ni siempre el 1.º)', async () => {
    await gameLoopApi.endSeason('me')
    const history = state.writes.find(w => w.table === 'season_history')
    expect(history.row).toEqual({ club_id: 'me', season_year: 2026, position: 2 })
  })

  it('solo reinicia la tabla de su propia competición, con la diferencia de gol incluida', async () => {
    await gameLoopApi.endSeason('me')
    expect(standingsQueries().every(q => q.filters.competition_id === 'comp-A')).toBe(true)
    const resets = state.writes.filter(w => w.table === 'standings' && w.op === 'update')
    expect(resets.map(r => r.filters.id).sort()).toEqual(['s1', 's2', 's3'])
    expect(resets[0].row).toMatchObject({ points: 0, goal_difference: 0, played: 0 })
  })

  it('un club sin liga no reinicia las tablas de nadie', async () => {
    state.myCompetition = null
    await gameLoopApi.endSeason('me')
    expect(state.writes.filter(w => w.table === 'standings')).toEqual([])
    expect(state.writes.find(w => w.table === 'season_history').row.position).toBe(1)
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
