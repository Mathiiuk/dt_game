// Omitir la conferencia: multa, evento según el resultado e idempotencia; responder mueve hinchada y dirigencia
const state = {}
const writes = []
const applied = []

vi.mock('../../src/api/climate', () => ({
  climateApi: {
    difficulty: { key: 'NORMAL', label: 'Normal', negative: 1, positive: 1 },
    applySquadConsequence: vi.fn(async (args) => { applied.push(args) }),
    getState: vi.fn(async () => ({ characters: state.characters || {} })),
    adjustJournalistGrudge: vi.fn(async (clubId, delta) => { state.grudgeCalls = [...(state.grudgeCalls || []), delta] })
  }
}))

vi.mock('../../src/api/finances', () => ({
  financesApi: { moveCash: vi.fn(async (args) => { state.ledger = args; return { newBudget: 4600 } }) }
}))

vi.mock('../../src/api/player', () => ({
  playerApi: { batchUpdate: vi.fn(async (rows) => { state.batched = rows }) }
}))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.is = () => q
    q.update = (row) => { writes.push({ table, row }); return q }
    q.insert = () => Promise.resolve({ error: null })
    const read = () => {
      if (table === 'press_conferences') return { status: state.status }
      if (table === 'clubs') return { budget: 5000, board_confidence: state.board }
      return null
    }
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => resolve({ data: table === 'players' ? state.players : (table === 'press_qa_items' ? [] : null), error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { pressApi } from '../../src/api/press'

const lost = { isHome: true, homeScore: 0, awayScore: 2 }

describe('omitir la rueda de prensa', () => {
  beforeEach(() => {
    writes.length = 0
    applied.length = 0
    state.status = 'IN_PROGRESS'
    state.board = 50
    state.ledger = null
    state.players = [{ id: 'p1', state_morale: 60 }]
  })

  it('tras perder cobra multa, la anota en el libro y deja el rumor de la prensa', async () => {
    const res = await pressApi.skipConference({ conferenceId: 'k1', clubId: 'c1', results: lost, rng: () => 0.2 })
    expect(res).toMatchObject({ kind: 'RUMOR', fine: 400, outcome: 'L' })
    expect(writes.some(w => w.table === 'clubs')).toBe(false)
    expect(state.ledger).toMatchObject({ category: 'FINE', amount: -400, allowNegative: true })
    expect(writes.find(w => w.table === 'press_conferences').row.status).toBe('SKIPPED')
    expect(applied[0].effects).toMatchObject({ fans: -3, board: -3 })
  })

  it('con la dirigencia arriba de 70 la multa baja a la mitad', async () => {
    state.board = 80
    const res = await pressApi.skipConference({ conferenceId: 'k1', clubId: 'c1', results: lost, rng: () => 0.7 })
    expect(res).toMatchObject({ fine: 200, covered: true })
  })

  it('no cobra dos veces si la conferencia ya se cerró', async () => {
    state.status = 'SKIPPED'
    const res = await pressApi.skipConference({ conferenceId: 'k1', clubId: 'c1', results: lost, rng: () => 0.2 })
    expect(res).toEqual({ alreadyClosed: true })
    expect(writes).toHaveLength(0)
    expect(applied).toHaveLength(0)
  })

  it('tras ganar, omitirla se lee como soberbia', async () => {
    const res = await pressApi.skipConference({ conferenceId: 'k1', clubId: 'c1', results: { isHome: false, homeScore: 0, awayScore: 1 }, rng: () => 0.1 })
    expect(res).toMatchObject({ kind: 'ARROGANCE', fine: 300 })
  })
})

describe('responder en la conferencia', () => {
  beforeEach(() => {
    writes.length = 0
    applied.length = 0
    state.players = [{ id: 'p1', state_morale: 60 }, { id: 'p2', state_morale: 98 }]
  })

  it('mueve la moral en lote y la hinchada y la dirigencia según el tono', async () => {
    await pressApi.submitAnswer({
      conferenceId: 'k1', questionId: 'q1', chosenTone: 'SELF_CRITICAL', answerText: 'Asumo', moraleImpact: 5, clubId: 'c1', outcome: 'L'
    })
    expect(state.batched).toEqual([{ id: 'p1', state_morale: 65 }, { id: 'p2', state_morale: 100 }])
    expect(applied[0].effects).toMatchObject({ fans: 1, board: 2 })
  })

  it('al terminar la conferencia respondiendo, el rencor del periodista baja un punto', async () => {
    state.grudgeCalls = []
    await pressApi.submitAnswer({ conferenceId: 'k1', questionId: 'q1', chosenTone: 'PRAISING', answerText: 'Gracias', moraleImpact: 1, clubId: 'c1' })
    expect(state.grudgeCalls).toEqual([-1])
  })

  it('sin resultado conocido solo se mueve la moral', async () => {
    await pressApi.submitAnswer({ conferenceId: 'k1', questionId: 'q1', chosenTone: 'PRAISING', answerText: 'Gracias', moraleImpact: 3, clubId: 'c1' })
    expect(applied).toHaveLength(0)
  })

  it('omitir deja rencor en el periodista, y dar la cara lo aplaca', async () => {
    state.grudgeCalls = []
    await pressApi.skipConference({ conferenceId: 'k1', clubId: 'c1', results: lost, rng: () => 0.7 })
    expect(state.grudgeCalls).toEqual([1])
  })
})

describe('el periodista recuerda', () => {
  beforeEach(() => {
    writes.length = 0
    applied.length = 0
    state.status = 'IN_PROGRESS'
    state.board = 50
  })

  it('con rencor acumulado, la misma tirada que antes era "nada" ahora termina en rumor, nombrando al periodista', async () => {
    state.characters = { journalist: { name: 'Pepe Cabrera', outlet: 'Radio del Barrio', grudge: 4 } }
    // 0,6 era "nada" (55% de rumor); con 4 puntos de rencor el umbral sube al 75%
    const res = await pressApi.skipConference({ conferenceId: 'k1', clubId: 'c1', results: lost, rng: () => 0.6 })
    expect(res.kind).toBe('RUMOR')
    expect(res.message).toMatch(/Pepe Cabrera, de Radio del Barrio/)
    state.characters = null
  })

  it('sin rencor, esa misma tirada no pasa nada', async () => {
    state.characters = null
    const res = await pressApi.skipConference({ conferenceId: 'k1', clubId: 'c1', results: lost, rng: () => 0.6 })
    expect(res.kind).toBe('NOTHING')
  })
})
