// Idempotencia del post-partido: el mismo partido nunca se procesa dos veces (lesiones, XP y dinero duplicados)
const state = { report: null, stats: [], inserts: [] }

vi.mock('../../src/api/supabase', () => {
  // Constructor mínimo de consultas encadenables para match_reports y player_match_stats
  const chain = (table) => {
    const q = { table }
    q.select = () => q
    q.eq = () => q
    q.maybeSingle = () => Promise.resolve({ data: table === 'match_reports' ? state.report : null, error: null })
    q.insert = (row) => {
      state.inserts.push([table, row])
      return Promise.resolve({ error: table === 'match_reports' && state.report ? { code: '23505', message: 'duplicate' } : null })
    }
    q.then = (resolve) => resolve({ data: table === 'player_match_stats' ? state.stats : [], error: null })
    return q
  }
  return { supabase: { from: (table) => chain(table) } }
})
vi.mock('../../src/api/manager', () => ({ managerApi: { addXp: vi.fn() } }))
vi.mock('../../src/api/gameConfig', () => ({ gameConfigApi: { getNumber: vi.fn(async (_k, d) => d) } }))
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn() } }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: {} }))
vi.mock('../../src/api/achievements', () => ({ achievementsApi: {} }))

import { postMatchApi } from '../../src/api/postMatch'

const result = { homeScore: 1, awayScore: 0, isHome: true, opponentName: 'Rival', events: [] }

describe('post-partido idempotente', () => {
  beforeEach(() => { state.report = null; state.stats = []; state.inserts = []; vi.restoreAllMocks() })

  it('si el partido ya fue procesado devuelve el resultado consolidado sin reclamar ni insertar nada', async () => {
    state.report = { fixture_id: 'f1', attendance: 500, gate_receipts_gross: 1000, match_xp_awarded: 50, mvp_player_id: 'p1' }
    state.stats = [{ player_id: 'p1', rating: 8.1, goals: 1, assists: 0, yellow_cards: 0, red_cards: 0, fitness_after_match: 70, morale_delta: 8, player: { first_name: 'Ana', last_name: 'Gómez', position: 'DEL', shirt_number: 9 } }]

    const out = await postMatchApi.processResult('m1', 'c1', result, 'f1')

    expect(out.idempotent).toBe(true)
    expect(out.xpAward).toBe(50)
    expect(out.mvp).toEqual({ player_id: 'p1', rating: 8.1 })
    expect(out.playerRatings[0].name).toBe('Ana Gómez')
    expect(state.inserts).toEqual([])
  })

  it('dos montajes simultáneos de la pantalla comparten una sola ejecución', async () => {
    const spy = vi.spyOn(postMatchApi, '_processResult').mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 20))
      return { xpAward: 5 }
    })

    const [a, b] = await Promise.all([
      postMatchApi.processResult('m1', 'c1', result, 'f2'),
      postMatchApi.processResult('m1', 'c1', result, 'f2')
    ])

    expect(spy).toHaveBeenCalledTimes(1)
    expect(a).toBe(b)
  })

  it('una vez terminada la ejecución, un nuevo partido (otro fixture) vuelve a procesarse', async () => {
    const spy = vi.spyOn(postMatchApi, '_processResult').mockResolvedValue({ xpAward: 5 })
    await postMatchApi.processResult('m1', 'c1', result, 'f3')
    await postMatchApi.processResult('m1', 'c1', result, 'f4')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
