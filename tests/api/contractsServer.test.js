// Contratos: la renovación y la rescisión las resuelve la base; el navegador solo propone los términos
const state = { rpc: [], rpcResult: null, writes: [], pending: [], created: [], agent: null }

vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async () => {}) } }))
vi.mock('../../src/api/events', () => ({
  eventsApi: {
    getPendingEvents: vi.fn(async () => state.pending),
    createFromTemplate: vi.fn(async (template, opts) => { state.created.push({ template, opts }); return true })
  }
}))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq']) q[m] = () => q
    q.update = (row) => { state.writes.push({ table, row }); return q }
    q.upsert = (row) => { state.writes.push({ table, row }); return q }
    q.maybeSingle = async () => ({ data: table === 'agents' ? state.agent : { attr_overall: 56, age: 25, attr_potential: 56, personality: 'Normal', market_value: 6000 } })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { contractApi } from '../../src/api/contracts'

const offer = { clubId: 'c1', playerId: 'p1', wageOffered: 120, yearsOffered: 2, squadRole: 'ROTATION', releaseClause: 18000, signingBonus: 200, currentWeek: 40, managerId: 'm1' }

describe('contratos resueltos por el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.rpcResult = () => ({ data: { status: 'ACCEPTED', round: 1, wage: 120, years: 2, contract_end: '2028-06-30', bonus: 200, previous_wage: 110 }, error: null })
  })

  it('la renovación se manda a la base con los términos propuestos y no escribe contratos ni caja desde el navegador', async () => {
    const res = await contractApi.submitRenewalOffer(offer)
    expect(state.rpc).toEqual([{ fn: 'negotiate_renewal', args: { p_player_id: 'p1', p_club_id: 'c1', p_wage: 120, p_years: 2, p_role: 'ROTATION', p_release_clause: 18000, p_bonus: 200, p_week: 40 } }])
    expect(state.writes).toEqual([])
    expect(res.status).toBe('ACCEPTED')
    expect(res.message).toMatch(/2 año/)
  })

  it('una propuesta insuficiente informa la ronda y lo que exige el jugador', async () => {
    state.rpcResult = () => ({ data: { status: 'REJECTED', round: 2, demands: { min_wage: 99, desired_role: 'ROTATION' } }, error: null })
    const res = await contractApi.submitRenewalOffer(offer)
    expect(res).toMatchObject({ status: 'REJECTED', roundsCompleted: 2 })
    expect(res.message).toMatch(/Ronda 2\/3/)
    expect(res.counterDemand.minAcceptableWage).toBe(99)
  })

  it('tras tres propuestas la mesa se rompe y el representante se retira cuatro semanas', async () => {
    state.rpcResult = () => ({ data: { status: 'COLLAPSED', round: 3, lockout_week: 44 }, error: null })
    const res = await contractApi.submitRenewalOffer(offer)
    expect(res.status).toBe('COLLAPSED')
    expect(res.message).toMatch(/4 semanas/)
  })

  it('los rechazos del servidor (bloqueo, caja) llegan con su mensaje', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'ERR_NEGOTIATION_LOCKED: Debes esperar 3 semana(s).' } })
    await expect(contractApi.submitRenewalOffer(offer)).rejects.toThrow(/ERR_NEGOTIATION_LOCKED/)
  })

  it('la rescisión la cobra la base: el finiquito sale del vencimiento real y el jugador queda libre', async () => {
    state.rpcResult = () => ({ data: { severance: 4191, weeks: 52, new_budget: 20809 }, error: null })
    const res = await contractApi.terminateContract('c1', 'p1', { managerId: 'm1' })
    expect(state.rpc).toEqual([{ fn: 'terminate_contract', args: { p_club_id: 'c1', p_player_id: 'p1' } }])
    expect(state.writes).toEqual([])
    expect(res).toEqual({ success: true, severancePaid: 4191, remainingBudget: 20809 })
  })

  it('sin caja para el finiquito se informa el mensaje del servidor', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'ERR_INSUFFICIENT_FUNDS_FOR_SEVERANCE: Saldo insuficiente.' } })
    await expect(contractApi.terminateContract('c1', 'p1')).rejects.toThrow(/INSUFFICIENT_FUNDS_FOR_SEVERANCE/)
  })

  it('el finiquito mostrado en pantalla usa la fecha de vencimiento y de juego, igual que la base', () => {
    expect(contractApi.calculateSeveranceCost({ contract_salary: 124, contract_end: '2027-06-30' }, '2026-07-01')).toBe(4191)
  })

  it('las pretensiones que muestra la mesa salen de la media real del jugador', () => {
    expect(contractApi.calculatePlayerDemands({ attr_overall: 56, age: 25, attr_potential: 56 }).expectedWage).toBe(116)
  })

  it('la comisión del representante la cobra la base: el mensaje la informa', async () => {
    state.rpcResult = () => ({ data: { status: 'ACCEPTED', round: 1, wage: 120, years: 2, bonus: 0, commission: 38, commission_rate: 0.08, previous_wage: 110 }, error: null })
    const res = await contractApi.submitRenewalOffer(offer)
    expect(res.commission).toBe(38)
    expect(res.message).toMatch(/Comisión del representante: \$38/)
    expect(state.writes).toEqual([])
  })
})

describe('pedido de salida por una oferta', () => {
  const buyer = { id: 'ai', name: 'Racing', budget: 90000 }
  const players = [{ id: 'p1', first_name: 'Hugo', last_name: 'Ríos', market_value: 6000, contract_salary: 120, agent_id: 'a1', is_transfer_listed: true }]
  const created = state.created

  beforeEach(() => {
    created.length = 0
    state.agent = { name: 'Carlos Méndez', personality: 'AGGRESSIVE' }
    state.pending = []
  })

  it('con un representante hostil y una oferta, el evento llega con el jugador y la acción', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await contractApi._maybeTransferDrama({ clubId: 'c1', player: players[0], buyer, amount: 6500, week: 4 })
    vi.restoreAllMocks()
    expect(created).toHaveLength(1)
    expect(created[0].template.template_code).toBe('EVT_TRANSFER_DRAMA_p1')
    expect(created[0].template.options.find(o => o.id === 'RAISE').effects.player_id).toBe('p1')
  })

  it('con mala suerte o con tres eventos pendientes no hay lío', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    await contractApi._maybeTransferDrama({ clubId: 'c1', player: players[0], buyer, amount: 6500, week: 4 })
    vi.restoreAllMocks()
    expect(created).toHaveLength(0)
    state.pending = [{}, {}, {}]
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await contractApi._maybeTransferDrama({ clubId: 'c1', player: players[0], buyer, amount: 6500, week: 4 })
    vi.restoreAllMocks()
    expect(created).toHaveLength(0)
  })
})

