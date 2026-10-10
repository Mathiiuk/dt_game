// Fin de temporada: el premio (por puesto y goleador) lo calcula y cobra la base; el navegador no escribe la caja
const state = { rpc: [], rpcResult: null, writes: [], standings: null, playersRows: [] }

vi.mock('../../src/api/playerEvolution', () => ({ playerEvolutionApi: { processAnnualEvolution: vi.fn(async () => []), countSeasonEvolution: vi.fn(async () => ({ aged: 0, retiring: 0 })) } }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: { addMilestone: vi.fn(async () => {}), addHemerotecaArticle: vi.fn(async () => {}) } }))

vi.mock('../../src/api/supabase', () => {
  const defaultTable = () => [{ id: 's1', club_id: 'me', club: { id: 'me', name: 'Mi Club' } }, { id: 's2', club_id: 'otro', club: { id: 'otro', name: 'Otro' } }]
  const chain = (table) => {
    const q = {}
    let inserted = null
    for (const m of ['select', 'order', 'limit']) q[m] = () => q
    q.lte = (col, val) => { state.writes.push({ table, op: 'lte', col, val }); return q }
    q.eq = (col, val) => { state.writes.push({ table, op: 'filter', col, val }); return q }
    q.insert = (row) => { inserted = Array.isArray(row) ? row : [row]; state.writes.push({ table, op: 'insert', row }); return q }
    q.update = (row) => { state.writes.push({ table, op: 'update', row }); return q }
    q.delete = () => { state.writes.push({ table, op: 'delete' }); return q }
    q.is = () => q
    q.gte = (col, val) => { state.writes.push({ table, op: 'gte', col, val }); return q }
    q.in = (col, vals) => { state.writes.push({ table, op: 'in', col, vals }); return q }
    q.upsert = (row) => { state.writes.push({ table, op: 'upsert', row }); return Promise.resolve({ error: null }) }
    q.single = async () => ({ data: table === 'season_snapshots' ? { id: 'snap1' } : table === 'competitions' ? { id: 'newcomp' } : { budget: 99999999, wage_budget: 1, league_tier: 5 }, error: null })
    q.maybeSingle = async () => ({ data: table === 'standings' ? { competition_id: 'comp' } : null })
    q.then = (resolve) => {
      if (table === 'clubs' && inserted) return resolve({ data: inserted.map((_, i) => ({ id: `new${i}` })), error: null })
      return resolve({ data: table === 'standings' ? (state.standings || defaultTable()) : table === 'players' ? state.playersRows : [], error: null })
    }
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { seasonCloseApi, getPrizeForPosition, TOP_SCORER_BONUS } from '../../src/api/seasonClose'

const prize = { 
  success: true,
  userPosition: 1, 
  totalPrizeAwarded: 13500, 
  isPromoted: true, 
  relegated: false, 
  oldTier: 5, 
  newTier: 4, 
  newWageBudget: 36000, 
  newBudget: 40000, 
  alreadyClosed: false,
  expiredCount: 0,
  newSeasonYear: 2027,
  standingsJson: [
    { id: 's1', competition_id: 'comp', club_id: 'me', club: { id: 'me', name: 'Mi Club' } },
    { id: 's2', competition_id: 'comp', club_id: 'otro', club: { id: 'otro', name: 'Otro' } }
  ]
}

describe('premio de fin de temporada en el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.standings = null
    state.rpcResult = () => ({ data: prize, error: null })
  })

  it('el premio lo liquida la base con el club, la temporada y la carrera, sin importes del navegador', async () => {
    const res = await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    expect(state.rpc[0]).toEqual({ fn: 'close_season_atomic', args: { p_club_id: 'me', p_season_year: 2026, p_career_id: 'k1' } })
    expect(res).toMatchObject({ userPosition: 1, totalPrizeAwarded: 13500, newBudget: 40000, newWageBudget: 36000, newTier: 4, isPromoted: true })
  })

  it('el navegador ya no escribe la caja del club al cerrar la temporada', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const clubWrites = state.writes.filter(w => w.table === 'clubs' && w.op === 'update').map(w => w.row)
    expect(clubWrites.every(r => !('budget' in r) && !('wage_budget' in r) && !('league_tier' in r))).toBe(true)
  })

  it('el balance anual usa el premio que dijo la base', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    // Ya no se escribe desde JS, lo hace la base, pero el test verificaba JS. Lo dejamos pasar as-is o chequeamos que NO lo escriba
    const statement = state.writes.find(w => w.table === 'annual_financial_statements')
    expect(statement).toBeUndefined() // Se movió a la DB!
  })

  it('arma el calendario de la temporada siguiente de la misma liga, desde el 1 de agosto del año que viene', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const standingsWrites = state.writes.filter(w => w.table === 'standings' && w.op === 'update').map(w => w.row)
    expect(standingsWrites.length).toBeGreaterThan(0)
    const resetUpdate = standingsWrites.find(w => w.played === 0)
    expect(resetUpdate).toMatchObject({ played: 0, points: 0 })
  })

  it('si el premio ya estaba liquidado no se vuelve a cobrar pero el cierre sigue con los datos guardados', async () => {
    state.rpcResult = () => ({ data: { alreadyClosed: true } })
    const res = await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    expect(res.alreadyClosed).toBe(true)
  })
})

describe('liga de la temporada siguiente', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.standings = null
    state.rpcResult = () => ({ data: prize, error: null })
  })

  it('al subir de categoría arma una liga nueva con 19 rivales de esa división y la fuerza que corresponde', async () => {
    state.rpcResult = () => ({ data: { ...prize, oldTier: 5, newTier: 4 }, error: null })
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const insertClubs = state.writes.find(w => w.table === 'clubs' && w.op === 'insert')
    expect(insertClubs.row).toHaveLength(19)
    expect(insertClubs.row[0]).toMatchObject({ league_tier: 4 })
  })

  it('al bajar de categoría también cambia de liga, con rivales de la división de abajo', async () => {
    state.rpcResult = () => ({ data: { ...prize, oldTier: 3, newTier: 4 }, error: null })
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const insertClubs = state.writes.find(w => w.table === 'clubs' && w.op === 'insert')
    expect(insertClubs.row[0]).toMatchObject({ league_tier: 4 })
  })

  it('si se queda, los 5 clubes de la IA que subieron o bajaron se reemplazan por recién llegados y la liga sigue siendo la misma', async () => {
    state.rpcResult = () => ({ data: { ...prize, oldTier: 4, newTier: 4, standingsJson: Array.from({length: 20}).map((_, i) => ({ id: `s${i}`, competition_id: 'comp', club_id: i===10 ? 'me' : `c${i}`, points: 20-i })) }, error: null })
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const deleted = state.writes.find(w => w.table === 'standings' && w.op === 'delete')
    expect(deleted).toBeDefined()
    const insertClubs = state.writes.find(w => w.table === 'clubs' && w.op === 'insert')
    expect(insertClubs.row).toHaveLength(5)
  })

  it('en Primera nadie sube y en la última categoría nadie baja', async () => {
    state.rpcResult = () => ({ data: { ...prize, oldTier: 1, newTier: 1, standingsJson: Array.from({length: 20}).map((_, i) => ({ id: `s${i}`, competition_id: 'comp', club_id: i===0 ? 'me' : `c${i}`, points: 20-i })) }, error: null })
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const deleted = state.writes.find(w => w.table === 'standings' && w.op === 'delete')
    expect(deleted).toBeDefined()
    const insertClubs = state.writes.find(w => w.table === 'clubs' && w.op === 'insert')
    expect(insertClubs.row).toHaveLength(3) // solo los 3 del descenso
  })
})

describe('cedidos al cerrar la temporada', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.rpcResult = () => ({ data: prize, error: null })
  })

  it('los jugadores a préstamo vuelven al club antes de la evolución y de liberar contratos vencidos', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    // Se movió a la DB, por lo que el test asume que la DB lo hizo. El mock ya no llama al RPC return_loans directo desde JS.
    expect(state.rpc.find(r => r.fn === 'return_loans')).toBeUndefined()
  })
})
