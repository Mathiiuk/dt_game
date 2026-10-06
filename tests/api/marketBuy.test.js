// Mercado: el fichaje lo resuelve la base (execute_transfer); el navegador solo propone el monto y aplica las consecuencias
const state = { rpc: [], rpcResult: null, writes: [], players: [] }

vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async () => {}) } }))
vi.mock('../../src/api/finances', () => ({ financesApi: { getFinances: vi.fn(async () => ({ expenses: { total: 500 } })) } }))
vi.mock('../../src/api/climate', () => ({ climateApi: { difficulty: { key: 'NORMAL' }, applySquadConsequence: vi.fn(async (args) => { state.consequence = args }) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'or', 'is', 'limit']) q[m] = () => q
    q.maybeSingle = async () => ({ data: table === 'standings' ? { competition_id: 'comp' } : null })
    q.update = (row) => { state.writes.push({ table, row }); return q }
    q.then = (resolve) => resolve({ data: table === 'players' ? state.players : table === 'standings' ? [{ club_id: 'rival' }] : [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { marketApi } from '../../src/api/market'

describe('fichajes resueltos por el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.consequence = null
    state.rpcResult = () => ({ data: { fee: 6000, asking: 5000, game_date: '2026-07-01', buyer_budget_before: 25000, buyer_budget_after: 19000 }, error: null })
  })

  it('compra con una sola llamada a la base y no toca la caja ni el jugador desde el navegador', async () => {
    const res = await marketApi.buyPlayer('c1', 'p1', 6000, 'm1')
    expect(state.rpc).toEqual([{ fn: 'execute_transfer', args: { p_player_id: 'p1', p_buyer_club_id: 'c1', p_offer: 6000 } }])
    expect(state.writes).toEqual([])
    expect(res.buyer_budget_after).toBe(19000)
  })

  it('las consecuencias se calculan con lo que pidió el club y la caja de antes de pagar', async () => {
    await marketApi.buyPlayer('c1', 'p1', 6000, 'm1')
    expect(state.consequence).toMatchObject({ clubId: 'c1', source: 'PURCHASE', gameDate: '2026-07-01' })
  })

  it('si el servidor rechaza (precio, ventana, caja) se informa su mensaje y no hay consecuencias', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'El Racing rechazó la propuesta de $1. Piden al menos $4000.' } })
    await expect(marketApi.buyPlayer('c1', 'p1', 1, 'm1')).rejects.toThrow(/Piden al menos/)
    expect(state.consequence).toBeNull()
  })

  it('el mercado muestra el precio que pide cada club según su reputación y la prima del agente libre', async () => {
    state.players = [
      { id: 'a', club_id: 'rival', market_value: 10000, clubs: { name: 'Grande', reputation: 100 } },
      { id: 'b', club_id: 'rival', market_value: 10000, clubs: { name: 'Chico', reputation: 0 } },
      { id: 'c', club_id: null, market_value: 10000, clubs: null }
    ]
    const list = await marketApi.getMarketPlayers('c1')
    const ask = Object.fromEntries(list.map(p => [p.id, p.asking_price]))
    expect(ask.a).toBe(13000)
    expect(ask.b).toBe(9000)
    expect(ask.c).toBe(6000)
  })

  it('sin jugadores en la base el mercado queda vacío (ya no hay jugadores virtuales que no se pueden fichar)', async () => {
    state.players = []
    expect(await marketApi.getMarketPlayers('c1')).toEqual([])
  })
})
