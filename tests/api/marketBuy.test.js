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

describe('negociación y fichajes resueltos por el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.consequence = null
    state.rpcResult = () => ({ data: { status: 'ACCEPTED', price: 6000, upfront: 6000, installments: 1, asking: 5000, game_date: '2026-07-01', buyer_budget_before: 25000, buyer_budget_after: 19000 }, error: null })
  })

  it('compra con una sola llamada a la base y no toca la caja ni el jugador desde el navegador', async () => {
    const res = await marketApi.negotiate('c1', 'p1', 6000, 1, 'm1')
    expect(state.rpc).toEqual([{ fn: 'negotiate_transfer', args: { p_player_id: 'p1', p_buyer_club_id: 'c1', p_offer: 6000, p_installments: 1 } }])
    expect(state.writes).toEqual([])
    expect(res.buyer_budget_after).toBe(19000)
  })

  it('las consecuencias se calculan con lo que pidió el club y la caja de antes de pagar', async () => {
    await marketApi.negotiate('c1', 'p1', 6000, 1, 'm1')
    expect(state.consequence).toMatchObject({ clubId: 'c1', source: 'PURCHASE', gameDate: '2026-07-01' })
  })

  it('si el servidor rechaza (precio, ventana, caja) se informa su mensaje y no hay consecuencias', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'El Racing rechazó la propuesta de $1. Piden al menos $4000.' } })
    await expect(marketApi.negotiate('c1', 'p1', 1, 1, 'm1')).rejects.toThrow(/Piden al menos/)
    expect(state.consequence).toBeNull()
  })

  it('una contraoferta o un rechazo no cuestan nada ni generan consecuencias: se devuelve la respuesta del club', async () => {
    state.rpcResult = () => ({ data: { status: 'COUNTER', round: 1, counter: 5200, final: false, installments: 1 }, error: null })
    expect(await marketApi.negotiate('c1', 'p1', 4500, 1, 'm1')).toMatchObject({ status: 'COUNTER', counter: 5200 })
    expect(state.consequence).toBeNull()
    state.rpcResult = () => ({ data: { status: 'REJECTED', round: 1, message: 'La oferta fue una ofensa.' }, error: null })
    expect((await marketApi.negotiate('c1', 'p1', 100, 1, 'm1')).status).toBe('REJECTED')
  })

  it('en 3 cuotas se manda el plan a la base', async () => {
    await marketApi.negotiate('c1', 'p1', 6480, 3, 'm1')
    expect(state.rpc[0].args).toMatchObject({ p_offer: 6480, p_installments: 3 })
  })

  it('las cuotas del cierre semanal se liquidan con la fecha del juego y el atraso queda anotado en la dirigencia', async () => {
    state.rpcResult = () => ({ data: { paid: 0, late: 2, paid_total: 0 }, error: null })
    await marketApi.settleInstallments({ clubId: 'c1', gameDate: '2026-07-15' })
    expect(state.rpc[0]).toEqual({ fn: 'settle_installments', args: { p_club_id: 'c1', p_game_date: '2026-07-15' } })
    expect(state.consequence.effects.board).toBe(-4)
    expect(state.consequence.effects.notes[0]).toMatch(/2 cuotas/)
  })

  it('si no hay cuotas vencidas no hay consecuencias, y un error de la base no frena la semana', async () => {
    state.rpcResult = () => ({ data: { paid: 1, late: 0, paid_total: 1500 }, error: null })
    await marketApi.settleInstallments({ clubId: 'c1', gameDate: '2026-07-15' })
    expect(state.consequence).toBeNull()
    state.rpcResult = () => ({ data: null, error: { message: 'boom' } })
    expect(await marketApi.settleInstallments({ clubId: 'c1', gameDate: '2026-07-15' })).toBeNull()
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
