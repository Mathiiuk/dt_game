// B15: delegar la prensa solo antes de contestar; "Terminar acá" conserva lo respondido
const state = { status: 'IN_PROGRESS', questions: [], writes: [], batched: null }

vi.mock('../../src/api/climate', () => ({ climateApi: { difficulty: { key: 'NORMAL', negative: 1, positive: 1 }, applySquadConsequence: vi.fn(), adjustJournalistGrudge: vi.fn(async () => {}) } }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: vi.fn(async (rows) => { state.batched = rows }) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { patch: null }
    for (const m of ['select', 'eq', 'is', 'order', 'limit']) q[m] = () => q
    q.update = (row) => { q.patch = row; return q }
    q.then = (resolve) => {
      if (table === 'press_conferences' && q.patch) {
        // `update ... where status = 'IN_PROGRESS'`: solo cierra una conferencia abierta
        if (state.status !== 'IN_PROGRESS') return resolve({ data: [], error: null })
        state.status = q.patch.status
        state.writes.push({ table, row: q.patch })
        return resolve({ data: [{ id: 'k1' }], error: null })
      }
      if (table === 'press_qa_items' && q.patch) {
        // `... where chosen_tone is null`: solo las preguntas sin responder
        state.questions = state.questions.map(x => (x.chosen_tone ? x : { ...x, ...q.patch }))
        state.writes.push({ table, row: q.patch })
        return resolve({ data: null, error: null })
      }
      if (table === 'press_qa_items') return resolve({ data: state.questions, error: null })
      if (table === 'players') return resolve({ data: [{ id: 'p1', state_morale: 60 }], error: null })
      return resolve({ data: null, error: null })
    }
    return q
  }
  return { supabase: { from: chain } }
})

import { pressApi } from '../../src/api/press'

describe('delegar y terminar la rueda de prensa', () => {
  beforeEach(() => {
    state.status = 'IN_PROGRESS'
    state.questions = [{ id: 'q1', chosen_tone: null }, { id: 'q2', chosen_tone: null }]
    state.writes = []
    state.batched = null
  })

  it('sin respuestas: el segundo entrenador contesta todo y el plantel suma 1 de moral', async () => {
    const res = await pressApi.delegateToAssistant('k1', 'c1')
    expect(res).toEqual({ success: true })
    expect(state.status).toBe('COMPLETED')
    expect(state.questions.every(q => q.chosen_tone === 'PRAGMATIC')).toBe(true)
    expect(state.batched).toEqual([{ id: 'p1', state_morale: 61 }])
  })

  it('con una pregunta ya contestada no se delega: no pisa la respuesta ni suma moral', async () => {
    state.questions[0] = { id: 'q1', chosen_tone: 'COMBATIVE', manager_answer_text: 'Nos robaron.' }
    const res = await pressApi.delegateToAssistant('k1', 'c1')
    expect(res).toEqual({ alreadyAnswered: true })
    expect(state.writes).toEqual([])
    expect(state.questions[0]).toMatchObject({ chosen_tone: 'COMBATIVE', manager_answer_text: 'Nos robaron.' })
    expect(state.status).toBe('IN_PROGRESS')
    expect(state.batched).toBeNull()
  })

  it('delegar dos veces seguidas suma la moral una sola vez', async () => {
    await pressApi.delegateToAssistant('k1', 'c1')
    state.batched = null
    state.questions = [{ id: 'q1', chosen_tone: null }] // aunque la lectura llegue vieja, la conferencia ya está cerrada
    expect(await pressApi.delegateToAssistant('k1', 'c1')).toEqual({ alreadyClosed: true })
    expect(state.batched).toBeNull()
  })

  it('terminar acá cierra la conferencia y deja las preguntas como estaban', async () => {
    state.questions[0] = { id: 'q1', chosen_tone: 'PRAISING' }
    expect(await pressApi.finishEarly('k1')).toEqual({ success: true })
    expect(state.status).toBe('COMPLETED')
    expect(state.questions).toEqual([{ id: 'q1', chosen_tone: 'PRAISING' }, { id: 'q2', chosen_tone: null }])
    expect(state.batched).toBeNull()
    expect(await pressApi.finishEarly('k1')).toEqual({ alreadyClosed: true })
  })
})
