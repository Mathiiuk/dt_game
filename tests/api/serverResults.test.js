// Copa Continental: los resultados los decide la base; el navegador solo los pide y liquida lo que sigue
const state = { rpc: [], rpcResult: null, writes: [], fixture: { id: 'f1', stage: 'semi_finals', tournament_id: 't1', home_club_id: 'me', away_club_id: 'rival', played: true, tournament: { season_year: 2026 } } }

vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async () => {}) } }))
vi.mock('../../src/api/manager', () => ({ managerApi: { addXp: vi.fn(async () => {}) } }))
vi.mock('../../src/api/reputation', () => ({ reputationApi: { applyReputationDelta: vi.fn(async () => {}) } }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: { addMilestone: vi.fn(async () => {}) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.in = () => q
    q.limit = () => q
    q.update = (row) => { state.writes.push({ table, row }); return q }
    q.single = async () => ({ data: table === 'international_fixtures' ? state.fixture : table === 'clubs' ? { budget: 1000, reputation: 50 } : null, error: null })
    q.maybeSingle = async () => ({ data: null })
    q.then = (resolve) => resolve({ data: [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { internationalCupApi } from '../../src/api/internationalCup'

describe('copa con resultados del servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.rpcResult = (fn) => (fn === 'play_cup_fixture' ? { data: { home_score: 2, away_score: 1 }, error: null } : { data: 3, error: null })
  })

  it('el partido del usuario lo decide la función de la base y después se liquidan los premios', async () => {
    const res = await internationalCupApi.playUserMatch('f1', 'me', 'm1')
    expect(state.rpc[0]).toEqual({ fn: 'play_cup_fixture', args: { p_fixture_id: 'f1', p_user_club_id: 'me' } })
    expect(res).toMatchObject({ homeScore: 2, awayScore: 1 })
    // El navegador no escribe el resultado del partido: solo premios y efectos del club
    expect(state.writes.filter(w => w.table === 'international_fixtures')).toEqual([])
    expect(state.writes.find(w => w.table === 'clubs')).toBeTruthy()
  })

  it('el premio lo acredita la base: el navegador no toca la caja y solo informa el monto', async () => {
    state.rpcResult = () => ({ data: { home_score: 2, away_score: 1, winner_club_id: 'me', match_bonus: 2500, champion_prize: 0 }, error: null })
    const res = await internationalCupApi.playUserMatch('f1', 'me', 'm1')
    expect(res.matchBonus).toBe(2500)
    const clubWrites = state.writes.filter(w => w.table === 'clubs').map(w => w.row)
    expect(clubWrites.every(r => !('budget' in r))).toBe(true)
  })

  it('si el servidor rechaza (otra fecha, ya jugado), se informa su mensaje y no se paga nada', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Este partido se juega el 2026-10-01. Avanzá las semanas hasta esa fecha.' } })
    await expect(internationalCupApi.playUserMatch('f1', 'me', 'm1')).rejects.toThrow(/Avanzá las semanas/)
    expect(state.writes).toEqual([])
  })

  it('los partidos de IA se resuelven con una sola llamada que lleva los ids y el club del usuario', async () => {
    const done = await internationalCupApi.simulateAiMatches([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'me')
    expect(state.rpc).toEqual([{ fn: 'play_cup_ai_fixtures', args: { p_user_club_id: 'me', p_fixture_ids: ['a', 'b', 'c'] } }])
    expect(done).toBe(3)
  })

  it('sin partidos de IA no llama al servidor', async () => {
    expect(await internationalCupApi.simulateAiMatches([], 'me')).toBe(0)
    expect(state.rpc).toEqual([])
  })

  it('un error del servidor al resolver la IA se propaga', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Club no encontrado.' } })
    await expect(internationalCupApi.simulateAiMatches([{ id: 'a' }], 'me')).rejects.toThrow(/Club no encontrado/)
  })
})
