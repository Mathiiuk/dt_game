// La caja se mueve en el servidor: el navegador no lee-resta-escribe el presupuesto
const state = { rpc: [], writes: [], rpcResult: null }

vi.mock('../../src/api/supabase', () => {
  const rows = {
    clubs: { id: 'c1', budget: 1000000, name: 'Potrero', board_confidence: 50, fans_confidence: 50 },
    dynamic_events: { id: 'e1', club_id: 'c1', status: 'PENDING', event_type: 'DEMO', title: 'Reunión', options: [{ id: 'o1', cost: 1500, effects: { budget: -200 } }] }
  }
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'order', 'limit', 'in', 'is', 'neq']) q[m] = () => q
    q.update = (row) => { state.writes.push({ table, op: 'update', row }); return q }
    q.insert = (row) => { state.writes.push({ table, op: 'insert', row }); return q }
    q.upsert = (row) => { state.writes.push({ table, op: 'upsert', row }); return q }
    q.single = async () => ({ data: rows[table] || {}, error: null })
    q.maybeSingle = async () => ({ data: rows[table] || null, error: null })
    q.then = (resolve) => resolve({ data: [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})
vi.mock('../../src/api/climate', () => ({ climateApi: { applyEventEffects: vi.fn(async () => ({})), load: vi.fn() } }))
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn() } }))

import { financesApi } from '../../src/api/finances'
import { stadiumApi } from '../../src/api/stadium'
import { eventsApi } from '../../src/api/events'

const budgetWrites = () => state.writes.filter(w => w.table === 'clubs' && w.op === 'update' && 'budget' in w.row)

describe('movimiento de caja en el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.rpcResult = () => ({ data: { moved: true, new_budget: 8500 }, error: null })
  })

  it('moveCash manda el importe firmado al servidor y devuelve la caja nueva', async () => {
    const res = await financesApi.moveCash({ clubId: 'c1', amount: -1500, category: 'TEST', description: 'prueba' })
    expect(state.rpc[0]).toEqual({ fn: 'club_cash_move', args: { p_club_id: 'c1', p_amount: -1500, p_category: 'TEST', p_description: 'prueba', p_career_id: null, p_allow_negative: false, p_ref: null } })
    expect(res.newBudget).toBe(8500)
  })

  it('un rechazo del servidor (fondos insuficientes) corta con su mensaje', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Fondos insuficientes en la tesorería.' } })
    await expect(financesApi.moveCash({ clubId: 'c1', amount: -1, category: 'TEST', description: 'x' })).rejects.toThrow('Fondos insuficientes en la tesorería.')
  })

  it('mejorar una instalación cobra en el servidor y solo sube el nivel desde el navegador', async () => {
    await financesApi.upgradeFacility('c1', 'store_level', 3000, 1)
    expect(state.rpc[0].args).toMatchObject({ p_amount: -3000, p_category: 'FACILITY' })
    expect(budgetWrites()).toEqual([])
    expect(state.writes.find(w => w.table === 'clubs' && w.row.store_level === 2)).toBeTruthy()
  })

  it('iniciar una obra del estadio cobra en el servidor y no escribe la caja', async () => {
    vi.spyOn(stadiumApi, 'getActiveProject').mockResolvedValue(null)
    vi.spyOn(stadiumApi, 'getStadiumDetails').mockResolvedValue({ capacity: 1500 })
    await stadiumApi.startProject('c1', Object.keys((await import('../../src/api/stadium')).STADIUM_CATALOG)[0])
    expect(state.rpc[0].args).toMatchObject({ p_category: 'INFRASTRUCTURE' })
    expect(state.rpc[0].args.p_amount).toBeLessThan(0)
    expect(budgetWrites()).toEqual([])
  })

  it('resolver un dilema cobra el costo y aplica el efecto de la caja en un solo movimiento del servidor', async () => {
    await eventsApi.resolveEvent('e1', { id: 'o1' }, 'm1')
    const move = state.rpc.find(r => r.fn === 'club_cash_move')
    expect(move.args).toMatchObject({ p_amount: -1700, p_category: 'DECISION', p_allow_negative: true })
    expect(budgetWrites()).toEqual([])
  })
})
