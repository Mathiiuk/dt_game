// El mercado pide la liga, los informes de ojeo y el pozo de agentes libres a la vez, no uno detrás del otro
const { st } = vi.hoisted(() => ({ st: { calls: [], release: null, gate: null } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    st.calls.push(table)
    for (const m of ['select', 'eq', 'or', 'is', 'limit']) q[m] = () => q
    q.maybeSingle = async () => ({ data: table === 'standings' ? { competition_id: 'comp' } : null })
    q.then = async (resolve) => {
      // Los jugadores del mercado tardan: mientras tanto el resto ya debe estar pedido
      if (table === 'players' && st.gate) await st.gate
      return resolve({ data: table === 'players' ? [{ id: 'p1', club_id: null, attr_overall: 60, attr_potential: 70, age: 22 }] : table === 'standings' ? [{ club_id: 'rival' }] : table === 'scout_reports' ? [{ player_id: 'p1', level: 2 }] : [], count: 99, error: null })
    }
    return q
  }
  return { supabase: { from: chain, rpc: vi.fn() } }
})

import { marketApi } from '../../src/api/market'

describe('mercado más rápido', () => {
  it('los informes de ojeo se piden sin esperar a los jugadores', async () => {
    st.gate = new Promise(r => { st.release = r })
    st.calls = []
    const pending = marketApi.getMarketPlayers('c1', { gameDate: '2026-08-05' })
    await new Promise(r => setTimeout(r, 20))
    expect(st.calls).toContain('scout_reports')
    st.release()
    const list = await pending
    expect(list[0]).toMatchObject({ id: 'p1', scout_level: 2 })
  })
})
