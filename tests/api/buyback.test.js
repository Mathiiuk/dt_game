const state = { rpc: [], rpcResult: null, rows: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    for (const m of ['select', 'eq', 'order']) q[m] = () => q
    q.then = (resolve) => resolve({ data: state.rows, error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { buybackApi } from '../../src/api/buyback'

describe('cláusula de recompra (cliente)', () => {
  beforeEach(() => { state.rpc = []; state.rows = [] })

  it('dejar la cláusula pide a la base y devuelve costo, precio y vencimiento', async () => {
    state.rpcResult = () => ({ data: { cost: 800, price: 10000, expires_season: 2032 }, error: null })
    const res = await buybackApi.grant('c1', 'p1')
    expect(state.rpc[0]).toEqual({ fn: 'grant_buyback', args: { p_club_id: 'c1', p_player_id: 'p1' } })
    expect(res).toEqual({ cost: 800, price: 10000, expiresSeason: 2032 })
  })

  it('ejercerla pide a la base con el derecho y devuelve el precio pagado', async () => {
    state.rpcResult = () => ({ data: { price: 10000, player_id: 'p1' }, error: null })
    expect(await buybackApi.exercise('c1', 'r1')).toEqual({ price: 10000 })
    expect(state.rpc[0]).toEqual({ fn: 'exercise_buyback', args: { p_club_id: 'c1', p_right_id: 'r1' } })
  })

  it('un rechazo de la base corta con su mensaje', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'La cláusula de recompra venció.' } })
    await expect(buybackApi.exercise('c1', 'r1')).rejects.toThrow('La cláusula de recompra venció.')
  })

  it('lista los derechos con el jugador', async () => {
    state.rows = [{ id: 'r1', price: 10000, expires_season: 2032, players: { first_name: 'A', last_name: 'Uno' } }]
    const list = await buybackApi.getRights('c1')
    expect(list).toHaveLength(1)
    expect(list[0].price).toBe(10000)
  })
})
