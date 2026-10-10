// Cierre de temporada retomable: si se corta a medias, se termina con los MISMOS resultados y sin repetir lo que ya se hizo
const { db, evo, comp } = vi.hoisted(() => ({
  db: { progress: null, logged: [], inserts: [], updates: [], rpcResult: null, rpcCalls: 0 },
  evo: { processAnnualEvolution: vi.fn(), countSeasonEvolution: vi.fn() },
  comp: { prepareNextLeague: vi.fn(), generateRoundRobinFixtures: vi.fn() }
}))

vi.mock('../../src/api/playerEvolution', () => ({ playerEvolutionApi: evo }))
vi.mock('../../src/api/competition', () => ({ competitionApi: comp }))
vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _f: {} }
    for (const m of ['select', 'order', 'limit', 'neq']) q[m] = () => q
    q.eq = (c, v) => { q._f[c] = v; return q }
    q.is = () => q
    q.insert = (row) => { db.inserts.push({ table, row }); return Promise.resolve({ error: null }) }
    q.update = (row) => {
      db.updates.push({ table, row })
      const u = { eq: () => { if (table === 'season_close_progress' && db.progress && !('played' in row)) db.progress = { ...db.progress, ...row }; return Promise.resolve({ error: null }) } }
      return u
    }
    q.maybeSingle = async () => ({ data: table === 'season_close_progress' ? db.progress : null, error: null })
    q.then = (resolve) => resolve({ data: table === 'season_transition_log' ? db.logged : [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async () => { db.rpcCalls++; return db.rpcResult() } } }
})

import { seasonCloseApi } from '../../src/api/seasonClose'

const result = {
  success: true, userPosition: 1, championClubId: 'me', isPromoted: false, totalPrizeAwarded: 12000, newBudget: 50000, newWageBudget: 30000,
  newTier: 5, oldTier: 5, expiredCount: 2, newSeasonYear: 2027,
  standingsJson: [{ club_id: 'me', competition_id: 'comp' }, { club_id: 'otro', competition_id: 'comp' }]
}
const args = { careerId: 'car', clubId: 'me', seasonYear: 2026 }
const fresh = (stage, payload = { result }) => ({ id: 'p1', club_id: 'me', career_id: 'car', season_year: 2026, stage, attempts: 0, payload })

beforeEach(() => {
  Object.assign(db, { progress: fresh('DB_DONE'), logged: [], inserts: [], updates: [], rpcCalls: 0, rpcResult: () => ({ data: result, error: null }) })
  evo.processAnnualEvolution.mockReset().mockResolvedValue([])
  evo.countSeasonEvolution.mockReset().mockResolvedValue({ aged: 18, retiring: 2 })
  comp.prepareNextLeague.mockReset().mockResolvedValue({ competitionId: 'comp', clubIds: ['me', 'otro'] })
  comp.generateRoundRobinFixtures.mockReset().mockResolvedValue()
})

describe('cierre de temporada por etapas', () => {
  it('corre todas las etapas en orden y deja la marca en COMPLETE', async () => {
    const res = await seasonCloseApi.executeSeasonClose(args)
    expect(res.success).toBe(true)
    expect(res.championClubId).toBe('me')
    expect(db.progress.stage).toBe('COMPLETE')
    expect(comp.generateRoundRobinFixtures).toHaveBeenCalledWith('comp', ['me', 'otro'], '2027-08-01')
    expect(db.inserts.find(i => i.table === 'season_transition_log').row).toMatchObject({ players_aged_count: 18, players_retired_count: 2, contracts_expired_count: 2, from_year: 2026, to_year: 2027 })
  })

  it('si falla la liga, avisa con partialClose, anota el intento y la evolución no se repite al retomar', async () => {
    comp.prepareNextLeague.mockRejectedValueOnce(new Error('boom'))
    await expect(seasonCloseApi.executeSeasonClose(args)).rejects.toMatchObject({ message: 'boom', partialClose: true })
    expect(db.progress.stage).toBe('EVOLUTION_DONE')
    expect(db.progress.last_error).toBe('boom')
    expect(db.progress.attempts).toBe(1)

    evo.processAnnualEvolution.mockClear()
    const res = await seasonCloseApi.resumeSeasonClose({ clubId: 'me', careerId: 'car' })
    expect(res.resumed).toBe(true)
    expect(res.totalPrizeAwarded).toBe(12000)
    expect(evo.processAnnualEvolution).not.toHaveBeenCalled()
    expect(db.progress.stage).toBe('COMPLETE')
  })

  it('si la temporada ya estaba cerrada y la segunda parte quedó a medias, la completa sin volver a pagar', async () => {
    db.progress = fresh('LEAGUE_READY', { result, evolution: { aged: 5, retiring: 1 }, league: { competitionId: 'comp', clubIds: ['me', 'otro'] } })
    db.rpcResult = () => ({ data: { alreadyClosed: true }, error: null })
    const res = await seasonCloseApi.executeSeasonClose(args)
    expect(res.resumed).toBe(true)
    expect(evo.processAnnualEvolution).not.toHaveBeenCalled()
    expect(comp.prepareNextLeague).not.toHaveBeenCalled()
    expect(comp.generateRoundRobinFixtures).toHaveBeenCalledTimes(1)
  })

  it('si ya estaba todo completo responde alreadyClosed y no toca nada', async () => {
    db.progress = fresh('COMPLETE')
    db.rpcResult = () => ({ data: { alreadyClosed: true }, error: null })
    const res = await seasonCloseApi.executeSeasonClose(args)
    expect(res.alreadyClosed).toBe(true)
    expect(evo.processAnnualEvolution).not.toHaveBeenCalled()
  })

  it('sin marca de avance (cierres de antes) sigue con el resultado en mano', async () => {
    db.progress = null
    const res = await seasonCloseApi.executeSeasonClose(args)
    expect(res.success).toBe(true)
    expect(comp.generateRoundRobinFixtures).toHaveBeenCalled()
  })

  it('no registra dos veces la transición', async () => {
    db.logged = [{ id: 'x' }]
    await seasonCloseApi.executeSeasonClose(args)
    expect(db.inserts.some(i => i.table === 'season_transition_log')).toBe(false)
  })

  it('resumeSeasonClose sin cierre pendiente no hace nada', async () => {
    db.progress = null
    const res = await seasonCloseApi.resumeSeasonClose({ clubId: 'me' })
    expect(res.alreadyClosed).toBe(true)
    expect(evo.processAnnualEvolution).not.toHaveBeenCalled()
  })

  it('un error de la base al cerrar se propaga sin marcar cierre parcial', async () => {
    db.rpcResult = () => ({ data: null, error: { message: 'sin liga' } })
    await expect(seasonCloseApi.executeSeasonClose(args)).rejects.toThrow('sin liga')
  })
})
