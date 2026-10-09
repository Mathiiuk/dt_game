// El eco de la prensa: lo que dijiste puede volver como un evento, sin romper nunca la respuesta
const created = []
const state = { pending: [], failCreate: false }

vi.mock('../../src/api/climate', () => ({
  climateApi: {
    difficulty: { key: 'NORMAL', label: 'Normal', negative: 1, positive: 1 },
    applySquadConsequence: vi.fn(async () => {}),
    getState: vi.fn(async () => ({ characters: { journalist: { name: 'Esteban Valenzuela', outlet: 'Diario El Potrero', times: 1 } } })),
    adjustJournalistGrudge: vi.fn(async () => {})
  }
}))
vi.mock('../../src/api/finances', () => ({ financesApi: { moveCash: vi.fn() } }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: vi.fn(async () => {}) } }))
vi.mock('../../src/api/events', () => ({
  eventsApi: {
    getPendingEvents: vi.fn(async () => state.pending),
    createFromTemplate: vi.fn(async (template, ctx) => {
      if (state.failCreate) throw new Error('boom')
      created.push({ template, ctx })
      return true
    })
  }
}))
vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.is = () => q
    q.update = () => q
    q.insert = () => Promise.resolve({ error: null })
    q.single = async () => ({ data: null, error: null })
    q.maybeSingle = async () => ({ data: null, error: null })
    q.then = (resolve) => resolve({ data: [], error: null })
    return q
  }
  return { supabase: { from: () => chain() } }
})

import { pressApi } from '../../src/api/press'

const answer = (extra = {}) => pressApi.submitAnswer({
  conferenceId: 'k1', questionId: 'q1', chosenTone: 'COMBATIVE', answerText: 'Les voy a decir cuatro cosas.',
  moraleImpact: 0, clubId: 'c1', managerId: 'm1', outcome: 'L', rivalName: 'Huracán', ...extra
})

describe('eco de la prensa al responder', () => {
  beforeEach(() => { created.length = 0; state.pending = []; state.failCreate = false })

  it('si lo dicho tiene eco crea el evento con el periodista del club, el rival y la frase', async () => {
    await answer({ rng: () => 0 })
    expect(created).toHaveLength(1)
    const { template, ctx } = created[0]
    expect(template.template_code).toBe('EVT_PRESS_ECHO_COMBATIVE')
    expect(template.description).toContain('Esteban Valenzuela')
    expect(template.description).toContain('Huracán')
    expect(template.description).toContain('Les voy a decir cuatro cosas.')
    expect(ctx).toMatchObject({ clubId: 'c1', managerId: 'm1' })
  })

  it('sin suerte no hay eco, y el pragmático nunca lo tiene', async () => {
    await answer({ rng: () => 0.99 })
    await answer({ chosenTone: 'PRAGMATIC', rng: () => 0 })
    expect(created).toHaveLength(0)
  })

  it('con 3 eventos pendientes no se suma otro', async () => {
    state.pending = [{}, {}, {}]
    await answer({ rng: () => 0 })
    expect(created).toHaveLength(0)
  })

  it('si crear el evento falla la respuesta igual se guarda', async () => {
    state.failCreate = true
    await expect(answer({ rng: () => 0 })).resolves.toBeDefined()
  })
})
