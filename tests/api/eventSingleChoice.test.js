// B1: un evento aleatorio aplica una sola opción aunque se aprieten dos seguidas (o desde dos pestañas)
const state = { event: null, rpc: [], claims: 0, releases: 0, rpcResult: null }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { patch: null }
    for (const m of ['select', 'eq', 'order', 'limit', 'in', 'is', 'neq']) q[m] = () => q
    q.update = (row) => { q.patch = row; return q }
    q.insert = () => q
    q.single = async () => ({ data: table === 'dynamic_events' ? { ...state.event } : { id: 'c1', budget: 10000, board_confidence: 50, fans_confidence: 50 }, error: null })
    q.maybeSingle = q.single
    // El `update ... where status = 'PENDING'` de la base es atómico: solo el primero encuentra la fila pendiente
    q.then = (resolve) => {
      if (table !== 'dynamic_events' || !q.patch) return resolve({ data: [], error: null })
      if (q.patch.status === 'PENDING') { state.releases++; state.event.status = 'PENDING'; return resolve({ data: [], error: null }) }
      if (state.event.status !== 'PENDING') return resolve({ data: [], error: null })
      state.event.status = 'RESOLVED'
      state.event.resolved_option_id = q.patch.resolved_option_id
      state.claims++
      return resolve({ data: [{ id: state.event.id }], error: null })
    }
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})
vi.mock('../../src/api/climate', () => ({ climateApi: { applyEventEffects: vi.fn(async () => 'nota'), onArcChapterResolved: vi.fn() } }))
vi.mock('../../src/api/reputation', () => ({ reputationApi: { applyReputationDelta: vi.fn(async () => ({})) } }))

import { eventsApi } from '../../src/api/events'
import { climateApi } from '../../src/api/climate'
import { reputationApi } from '../../src/api/reputation'

const cashMoves = () => state.rpc.filter(r => r.fn === 'club_cash_move')

describe('resolver un evento: una sola opción', () => {
  beforeEach(() => {
    state.event = {
      id: 'e1', club_id: 'c1', status: 'PENDING', title: 'El micro',
      options: [
        { id: 'a', cost: 500, effects: { fans: 2, reputation: 1 } },
        { id: 'b', cost: 0, effects: { budget: 300, board: -2 } }
      ]
    }
    state.rpc = []
    state.claims = 0
    state.releases = 0
    state.rpcResult = () => ({ data: { moved: true, new_budget: 9500 }, error: null })
    vi.clearAllMocks()
  })

  it('dos opciones apretadas a la vez: se aplica una sola', async () => {
    const results = await Promise.all([
      eventsApi.resolveEvent('e1', { id: 'a' }, 'm1'),
      eventsApi.resolveEvent('e1', { id: 'b' }, 'm1')
    ])
    expect(results.filter(r => r.success)).toHaveLength(1)
    expect(results.filter(r => r.alreadyResolved)).toHaveLength(1)
    expect(state.claims).toBe(1)
    expect(cashMoves()).toHaveLength(1)
    expect(climateApi.applyEventEffects).toHaveBeenCalledTimes(1)
    // Lo que quedó guardado es la opción que ganó, y sus efectos son los únicos aplicados
    const winner = results.find(r => r.success)
    expect(state.event.resolved_option_id).toBe(winner.resolvedOptionId)
    expect(cashMoves()[0].args.p_amount).toBe(winner.resolvedOptionId === 'a' ? -500 : 300)
  })

  it('un evento ya resuelto no vuelve a aplicar nada', async () => {
    await eventsApi.resolveEvent('e1', { id: 'a' }, 'm1')
    const again = await eventsApi.resolveEvent('e1', { id: 'b' }, 'm1')
    expect(again).toEqual({ alreadyResolved: true })
    expect(cashMoves()).toHaveLength(1)
    expect(reputationApi.applyReputationDelta).toHaveBeenCalledTimes(1)
  })

  it('si la caja no se puede mover el evento vuelve a quedar pendiente y no se aplica ningún efecto', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Fondos insuficientes en la tesorería.' } })
    await expect(eventsApi.resolveEvent('e1', { id: 'a' }, 'm1')).rejects.toThrow('Fondos insuficientes')
    expect(state.releases).toBe(1)
    expect(state.event.status).toBe('PENDING')
    expect(climateApi.applyEventEffects).not.toHaveBeenCalled()
  })

  it('sin fondos para el costo no se reclama el evento', async () => {
    state.event.options[0].cost = 999999
    await expect(eventsApi.resolveEvent('e1', { id: 'a' }, 'm1')).rejects.toThrow()
    expect(state.claims).toBe(0)
    expect(state.event.status).toBe('PENDING')
  })
})
