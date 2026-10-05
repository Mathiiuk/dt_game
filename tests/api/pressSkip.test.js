// Omitir la conferencia: multa, evento según el resultado e idempotencia; responder mueve hinchada y dirigencia
const state = {}
const writes = []
const applied = []

vi.mock('../../src/api/climate', () => ({
  climateApi: {
    difficulty: { key: 'NORMAL', label: 'Normal', negative: 1, positive: 1 },
    applySquadConsequence: vi.fn(async (args) => { applied.push(args) })
  }
}))

vi.mock('../../src/api/finances', () => ({
  financesApi: { recordLedgerTransaction: vi.fn(async (args) => { state.ledger = args }) }
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
    expect(writes.find(w => w.table === 'clubs').row).toEqual({ budget: 4600 })
    expect(state.ledger).toMatchObject({ category: 'FINE', amount: -400 })
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

  it('sin resultado conocido solo se mueve la moral', async () => {
    await pressApi.submitAnswer({ conferenceId: 'k1', questionId: 'q1', chosenTone: 'PRAISING', answerText: 'Gracias', moraleImpact: 3, clubId: 'c1' })
    expect(applied).toHaveLength(0)
  })
})
