// Cierre del partido del usuario: el resultado y la tabla los valida y escribe la base (finish_user_fixture)
const state = { rpc: [], rpcResult: null, writes: [], inserts: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.insert = (rows) => { state.inserts.push({ table, rows }); return Promise.resolve({ error: null }) }
    q.update = (row) => { state.writes.push({ table, row }); return q }
    q.eq = () => q
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult() } } }
})

import { matchEngineApi } from '../../src/api/matchEngine'

describe('cierre del partido del usuario', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.inserts = []
    state.rpcResult = () => ({ data: { fixture_id: 'f1' }, error: null })
  })

  it('el resultado oficial lo cierra la base, no el navegador', async () => {
    await matchEngineApi.finalizeMatch('f1', 'c1', true, 'Rival', 2, 1, [], {})
    expect(state.rpc).toEqual([{ fn: 'finish_user_fixture', args: { p_fixture_id: 'f1', p_user_club_id: 'c1', p_home: 2, p_away: 1 } }])
    expect(state.writes.filter(w => w.table === 'fixtures')).toEqual([])
  })

  it('guarda los goles y tarjetas en el relato del partido', async () => {
    const events = [{ minute: 10, type: 'GOAL', playerId: '11111111-1111-1111-1111-111111111111', text: 'Gol' }, { minute: 20, type: 'SAVE', text: 'Atajada' }]
    await matchEngineApi.finalizeMatch('f1', 'c1', true, 'Rival', 1, 0, events, {})
    const rows = state.inserts.find(i => i.table === 'match_events').rows
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ fixture_id: 'f1', minute: 10, event_type: 'GOAL' })
  })

  it('si la base rechaza el cierre (ya disputado, otra fecha) no se inventa un resultado ni se rompe el flujo', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Este partido ya fue disputado.' } })
    await expect(matchEngineApi.finalizeMatch('f1', 'c1', true, 'Rival', 2, 1, [], {})).resolves.toBe(true)
    expect(state.writes.filter(w => w.table === 'fixtures')).toEqual([])
  })

  it('un amistoso sin partido oficial no toca la liga', async () => {
    await matchEngineApi.finalizeMatch(null, 'c1', true, 'Rival', 1, 1, [], {})
    expect(state.rpc).toEqual([])
  })
})
