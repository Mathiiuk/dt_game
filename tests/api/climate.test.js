// Consecuencias del clima: un partido y el cierre semanal modifican los medidores y dejan registro
const state = {}
const writes = []

vi.mock('../../src/api/morale', () => ({
  moraleApi: { getStreaks: vi.fn(async () => state.streaks) }
}))

vi.mock('../../src/api/finances', () => ({
  financesApi: { getFinances: vi.fn(async () => state.finances) }
}))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    let op = 'select'
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.update = (row) => { op = 'update'; writes.push({ table, op, row }); return q }
    q.insert = (row) => { writes.push({ table, op: 'insert', row }); return Promise.resolve({ error: null }) }
    const read = () => {
      if (table === 'clubs') return state.club
      if (table === 'club_board_confidence') return state.board
      return null
    }
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { climateApi } from '../../src/api/climate'

const clubWrite = () => writes.find(w => w.table === 'clubs' && w.op === 'update')?.row
const logs = () => writes.filter(w => w.table === 'consequence_log')

describe('clima del club', () => {
  beforeEach(() => {
    writes.length = 0
    state.club = { fans_confidence: 60, squad_morale: 50, board_confidence: 70, budget: 20000, ticket_price: 10, wage_budget: 3500 }
    state.board = { sports_satisfaction: 60, financial_satisfaction: 70, squad_satisfaction: 70 }
    state.streaks = { results: [], fixtureIds: [], win: 0, loss: 0, unbeaten: 0, winless: 0 }
    state.finances = { balance: 20000, expectedWeeklyFlow: 500, wageOverBudget: false }
  })

  it('la tercera derrota seguida baja hinchada, vestuario y confianza de la dirigencia, y queda registrada', async () => {
    state.streaks = { results: ['W', 'L', 'L', 'L'], fixtureIds: ['f1', 'f2', 'f3', 'f4'], win: 0, loss: 3, unbeaten: 0, winless: 3 }
    const effects = await climateApi.applyMatchConsequences({
      clubId: 'c1', fixtureId: 'f4', result: { isHome: true, homeScore: 0, awayScore: 1 }, gameDate: '2026-09-01'
    })
    expect(effects).toMatchObject({ fans: -5, board: -3, locker: -12 })
    expect(clubWrite()).toMatchObject({ fans_confidence: 55, squad_morale: 38 })
    const board = writes.find(w => w.table === 'club_board_confidence' && w.op === 'update').row
    expect(board.sports_satisfaction).toBe(54)
    expect(logs()).toHaveLength(1)
    expect(logs()[0].row.message).toMatch(/3 derrotas seguidas/)
  })

  it('si el partido todavía no está guardado como jugado, se suma a la racha', async () => {
    state.streaks = { results: ['L', 'L'], fixtureIds: ['f1', 'f2'], win: 0, loss: 2, unbeaten: 0, winless: 2 }
    const effects = await climateApi.applyMatchConsequences({
      clubId: 'c1', fixtureId: 'f3', result: { isHome: true, homeScore: 0, awayScore: 2 }
    })
    expect(effects.board).toBe(-3)
  })

  it('una victoria aislada solo sube el vestuario', async () => {
    state.streaks = { results: ['W'], fixtureIds: ['f1'], win: 1, loss: 0, unbeaten: 1, winless: 0 }
    await climateApi.applyMatchConsequences({ clubId: 'c1', fixtureId: 'f1', result: { isHome: true, homeScore: 2, awayScore: 0 } })
    expect(clubWrite()).toEqual({ squad_morale: 58 })
    expect(logs()).toHaveLength(0)
  })

  it('entrada cara con el equipo sin ganar enoja a la hinchada en el cierre semanal', async () => {
    state.club.ticket_price = 18
    state.streaks = { results: ['L', 'D', 'L'], fixtureIds: [], win: 0, loss: 1, unbeaten: 0, winless: 3 }
    const res = await climateApi.processWeek({ clubId: 'c1', gameDate: '2026-09-01' })
    expect(res.mood.fans).toBe(-6)
    expect(clubWrite()).toMatchObject({ fans_confidence: 54 })
    expect(logs()[0].row.source).toBe('TICKET_PRICE')
  })

  it('el cierre semanal actualiza la satisfacción financiera y de plantel de la dirigencia', async () => {
    state.finances = { balance: -500, expectedWeeklyFlow: -1200, wageOverBudget: true }
    await climateApi.processWeek({ clubId: 'c1' })
    const board = writes.filter(w => w.table === 'club_board_confidence' && w.op === 'update').pop().row
    expect(board.financial_satisfaction).toBeLessThan(15)
    expect(board.squad_satisfaction).toBe(50)
    expect(board.confidence_score).toBeLessThan(60)
  })
})
