// Ventas: el traspaso de un jugador de tu club lo resuelve la base; el navegador no manda monto ni clubes
const state = { rpc: [], rpcResult: null, consequence: null }

const finance = { expenses: { total: 1000 } }
vi.mock('../../src/api/finances', () => ({ financesApi: { getFinances: vi.fn(async () => finance) } }))
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async () => {}) } }))
vi.mock('../../src/api/climate', async () => {
  const { DIFFICULTY } = await import('../../src/domain/consequences')
  return { climateApi: { difficulty: DIFFICULTY.NORMAL, applySquadConsequence: vi.fn(async (args) => { state.consequence = args }) } }
})

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq']) q[m] = () => q
    q.maybeSingle = async () => ({ data: table === 'players' ? { is_idol: true } : { captain_player_id: 'p1' } })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { contractApi } from '../../src/api/contracts'

describe('ventas resueltas por el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.consequence = null
    state.rpcResult = () => ({ data: { status: 'ACCEPTED', amount: 10000, reinvestment: 8000, player_id: 'p1', new_budget: 33000, game_date: '2026-07-01' }, error: null })
  })

  it('aceptar manda solo el id de la oferta y la acción: el monto no sale del navegador', async () => {
    const res = await contractApi.resolveOffer('o1', 'ACCEPTED', 'p1', 'ai', 'c1', 999999, 'm1')
    expect(state.rpc).toEqual([{ fn: 'resolve_sale_offer', args: { p_offer_id: 'o1', p_action: 'ACCEPTED', p_counter: null } }])
    expect(res).toEqual({ status: 'ACCEPTED', amount: 10000, reinvestment: 8000, newBudget: 33000 })
  })

  it('vender al ídolo o al capitán deja consecuencias en la tribuna y el vestuario', async () => {
    await contractApi.resolveOffer('o1', 'ACCEPTED', 'p1', 'ai', 'c1', 10000, 'm1')
    expect(state.consequence).toMatchObject({ clubId: 'c1', source: 'SALE', gameDate: '2026-07-01' })
    expect(state.consequence.effects.fans).toBeLessThan(0)
  })

  it('la contraoferta viaja con su monto y la base decide si el comprador la acepta', async () => {
    await contractApi.resolveOffer('o1', 'COUNTER', 'p1', 'ai', 'c1', 10000, 'm1', { counterAmount: 12000 })
    expect(state.rpc[0].args).toEqual({ p_offer_id: 'o1', p_action: 'COUNTER', p_counter: 12000 })
    state.rpcResult = () => ({ data: { status: 'REJECTED', message: 'El club comprador rechazó la contraoferta.' }, error: null })
    const res = await contractApi.resolveOffer('o1', 'COUNTER', 'p1', 'ai', 'c1', 10000, 'm1', { counterAmount: 50000 })
    expect(res.status).toBe('REJECTED')
    expect(state.consequence).toMatchObject({ source: 'SALE' }) // la del primer intento: la rechazada no suma otra
  })

  it('vender con la caja en apuros alivia a la dirigencia (caja de antes de cobrar la venta)', async () => {
    // Caja nueva $6.000 con $4.000 de reinversión: antes había $2.000 contra gastos de $1.000 por semana
    state.rpcResult = () => ({ data: { status: 'ACCEPTED', amount: 5000, reinvestment: 4000, player_id: 'p1', new_budget: 6000, game_date: '2026-07-01' }, error: null })
    await contractApi.resolveOffer('o1', 'ACCEPTED', 'p1', 'ai', 'c1', 5000, 'm1')
    expect(state.consequence.effects.board).toBeGreaterThan(0)
    expect(state.consequence.effects.notes.join(' ')).toMatch(/caja en apuros/)
  })

  it('rechazar no mueve nada ni genera consecuencias de venta', async () => {
    state.rpcResult = () => ({ data: { status: 'REJECTED', morale_penalty: 15 }, error: null })
    const res = await contractApi.resolveOffer('o1', 'REJECTED', 'p1', 'ai', 'c1', 10000, 'm1')
    expect(res).toEqual({ status: 'REJECTED', morale_penalty: 15 })
    expect(state.consequence).toBeNull()
  })

  it('si el servidor rechaza (ya resuelta, no es tu oferta, jugador ajeno) se informa su mensaje', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'La oferta ya fue resuelta anteriormente.' } })
    await expect(contractApi.resolveOffer('o1', 'ACCEPTED', 'p1', 'ai', 'c1', 10000, 'm1')).rejects.toThrow(/ya fue resuelta/)
    expect(state.consequence).toBeNull()
  })
})
