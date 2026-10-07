// Fin de temporada: el premio (por puesto y goleador) lo calcula y cobra la base; el navegador no escribe la caja
const state = { rpc: [], rpcResult: null, writes: [] }

vi.mock('../../src/api/playerEvolution', () => ({ playerEvolutionApi: { processAnnualEvolution: vi.fn(async () => []) } }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: { addMilestone: vi.fn(async () => {}), addHemerotecaArticle: vi.fn(async () => {}) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'order', 'limit', 'lte']) q[m] = () => q
    q.insert = (row) => { state.writes.push({ table, op: 'insert', row }); return q }
    q.update = (row) => { state.writes.push({ table, op: 'update', row }); return q }
    q.upsert = (row) => { state.writes.push({ table, op: 'upsert', row }); return Promise.resolve({ error: null }) }
    q.single = async () => ({ data: table === 'season_snapshots' ? { id: 'snap1' } : { budget: 99999999, wage_budget: 1, league_tier: 5 }, error: null })
    q.maybeSingle = async () => ({ data: table === 'standings' ? { competition_id: 'comp' } : null })
    q.then = (resolve) => resolve({ data: table === 'standings' ? [{ id: 's1', club_id: 'me', club: { id: 'me', name: 'Mi Club' } }, { id: 's2', club_id: 'otro', club: { id: 'otro', name: 'Otro' } }] : [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { seasonCloseApi, getPrizeForPosition, TOP_SCORER_BONUS } from '../../src/api/seasonClose'

const prize = { position: 1, prize: 12000, top_scorer_bonus: 1500, total: 13500, promoted: true, new_tier: 4, new_wage_budget: 36000, new_budget: 40000, already_settled: false }

describe('premio de fin de temporada en el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.rpcResult = () => ({ data: prize, error: null })
  })

  it('el premio lo liquida la base con el club, la temporada y la carrera, sin importes del navegador', async () => {
    const res = await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    expect(state.rpc[0]).toEqual({ fn: 'settle_season_prize', args: { p_club_id: 'me', p_season_year: 2026, p_career_id: 'k1' } })
    expect(res).toMatchObject({ userPosition: 1, totalPrizeAwarded: 13500, newBudget: 40000, newWageBudget: 36000, newTier: 4, isPromoted: true })
  })

  it('el navegador ya no escribe la caja del club al cerrar la temporada', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const clubWrites = state.writes.filter(w => w.table === 'clubs' && w.op === 'update').map(w => w.row)
    expect(clubWrites.every(r => !('budget' in r) && !('wage_budget' in r) && !('league_tier' in r))).toBe(true)
  })

  it('el balance anual usa el premio que dijo la base', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const statement = state.writes.find(w => w.table === 'annual_financial_statements')
    expect(statement.row).toMatchObject({ prize_money_received: 13500, approved_wage_budget_next_year: 36000 })
  })

  it('arma el calendario de la temporada siguiente de la misma liga, desde el 1 de agosto del año que viene', async () => {
    await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    const rows = state.writes.filter(w => w.table === 'fixtures' && w.op === 'insert').flatMap(w => w.row)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(r => r.competition_id === 'comp' && r.match_date >= '2027-08-01')).toBe(true)
  })

  it('si la base rechaza la liquidación (club ajeno) el cierre se corta con su mensaje', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Club no encontrado.' } })
    await expect(seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'x', seasonYear: 2026 })).rejects.toThrow('Club no encontrado.')
  })

  it('si el premio ya estaba liquidado no se vuelve a cobrar pero el cierre sigue con los datos guardados', async () => {
    state.rpcResult = () => ({ data: { ...prize, already_settled: true }, error: null })
    const res = await seasonCloseApi.executeSeasonClose({ careerId: 'k1', clubId: 'me', seasonYear: 2026 })
    expect(res.totalPrizeAwarded).toBe(13500)
  })
})

// Estos valores salen de settle_season_prize en la base: si cambia la escala, tiene que cambiar en las dos
describe('escala de premios', () => {
  it('premio por puesto', () => {
    expect([1, 2, 3, 6, 7, 17, 18, 20].map(getPrizeForPosition)).toEqual([12000, 8000, 5000, 5000, 2500, 2500, 1000, 1000])
  })
  it('bono del goleador', () => {
    expect(TOP_SCORER_BONUS).toBe(1500)
  })
})

describe('cierre con la tabla de la liga', () => {
  it('no pide columnas que clubs no tiene (logo_url hacía fallar la consulta de la tabla)', async () => {
    const fs = await import('node:fs')
    expect(fs.readFileSync('src/api/seasonClose.js', 'utf8')).not.toContain('logo_url')
  })
})
