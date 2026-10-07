const state = { offer: null, updates: [], deleted: [] }

vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn() } }))
vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'order', 'limit']) q[m] = () => q
    q.update = (row) => { state.updates.push({ table, row }); return q }
    q.maybeSingle = async () => ({ data: state.offer, error: null })
    q.single = async () => ({ data: state.offer, error: null })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { careerApi } from '../../src/api/career'

const offer = (over = {}) => ({ id: 'o1', manager_id: 'm1', offering_club_tier: 4, wage_offered: 1000, negotiation_rounds: 0, status: 'PENDING', ...over })

describe('negociar una oferta de trabajo (API)', () => {
  beforeEach(() => { state.offer = offer(); state.updates = [] })

  it('un pedido razonable se acepta: el sueldo de la oferta sube y se cuenta la ronda', async () => {
    const res = await careerApi.negotiateJobOffer('m1', 'o1', 1100, 60)
    expect(res).toMatchObject({ status: 'ACCEPTED', wage: 1100, round: 1 })
    expect(state.updates[0].row).toMatchObject({ wage_offered: 1100, negotiation_rounds: 1 })
  })

  it('una contraoferta deja el sueldo que dio el club y la segunda ronda ya no se mueve', async () => {
    const first = await careerApi.negotiateJobOffer('m1', 'o1', 1180, 30)
    expect(first.status).toBe('COUNTER')
    state.offer = offer({ wage_offered: first.wage, negotiation_rounds: 1 })
    const second = await careerApi.negotiateJobOffer('m1', 'o1', first.wage * 2, 30)
    expect(second.status).toBe('FINAL')
  })

  it('un pedido desmedido retira la oferta', async () => {
    const res = await careerApi.negotiateJobOffer('m1', 'o1', 5000, 30)
    expect(res.status).toBe('WITHDRAWN')
    expect(state.updates[0].row).toMatchObject({ status: 'EXPIRED' })
  })

  it('con las rondas agotadas no se puede seguir y no escribe nada', async () => {
    state.offer = offer({ negotiation_rounds: 2 })
    const res = await careerApi.negotiateJobOffer('m1', 'o1', 1100, 60)
    expect(res.status).toBe('CLOSED')
    expect(state.updates).toEqual([])
  })

  it('una oferta ajena o inexistente se rechaza', async () => {
    state.offer = null
    await expect(careerApi.negotiateJobOffer('m1', 'o1', 1100, 60)).rejects.toThrow(/oferta/i)
    state.offer = offer({ manager_id: 'otro' })
    await expect(careerApi.negotiateJobOffer('m1', 'o1', 1100, 60)).rejects.toThrow(/oferta/i)
  })
})
