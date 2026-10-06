// Cierre semanal del clima: los combos y círculos viciosos se aplican una vez y quedan en el feed
const state = {}
const writes = []

vi.mock('../../src/api/morale', () => ({ moraleApi: { getStreaks: vi.fn(async () => state.streaks) } }))
vi.mock('../../src/api/finances', () => ({ financesApi: { getFinances: vi.fn(async () => state.finances) } }))
vi.mock('../../src/api/training', () => ({ trainingApi: { getRecentIntensities: vi.fn(async () => state.recent) } }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: vi.fn(async () => {}) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.in = () => q
    q.update = (row) => { writes.push({ table, op: 'update', row }); return q }
    q.insert = (row) => { writes.push({ table, op: 'insert', row }); return Promise.resolve({ error: null }) }
    const read = () => (table === 'clubs' ? state.club : table === 'club_board_confidence' ? state.board : null)
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => resolve({ data: table === 'players' ? state.players : null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { climateApi } from '../../src/api/climate'

const logs = () => writes.filter(w => w.table === 'consequence_log').map(w => w.row)
const clubWrites = () => writes.filter(w => w.table === 'clubs' && w.op === 'update').map(w => w.row)

describe('combos en el cierre semanal', () => {
  beforeEach(() => {
    writes.length = 0
    state.club = { fans_confidence: 60, squad_morale: 50, ticket_price: 6, budget: 20000, wage_budget: 3500 }
    state.board = { sports_satisfaction: 60 }
    state.finances = { balance: 20000, expectedWeeklyFlow: 500, wageOverBudget: false }
    state.players = [{ id: 'a', attr_overall: 60, contract_salary: 100, state_morale: 70, is_injured: false }]
    state.recent = []
    state.streaks = { results: ['W', 'W', 'W'], fixtureIds: [], win: 3, loss: 0, unbeaten: 3, winless: 0 }
  })

  it('entrada barata y tres victorias seguidas: la fiesta del pueblo sube la hinchada y queda registrada como combo', async () => {
    await climateApi.processWeek({ clubId: 'c1', gameDate: '2026-09-01' })
    const combo = logs().find(l => l.source === 'COMBO')
    expect(combo.message).toMatch(/La fiesta del pueblo/)
    expect(clubWrites().some(r => r.fans_confidence === 68)).toBe(true)
  })

  it('con la racha en cuatro ya no se repite', async () => {
    state.streaks = { ...state.streaks, win: 4, unbeaten: 4 }
    await climateApi.processWeek({ clubId: 'c1' })
    expect(logs().find(l => l.source === 'COMBO')).toBeUndefined()
  })

  it('entrenar al límite tres semanas con varios lesionados: plantel reventado', async () => {
    state.club.ticket_price = 10
    state.streaks = { results: [], fixtureIds: [], win: 0, loss: 0, unbeaten: 0, winless: 0 }
    state.recent = ['HIGH', 'HIGH', 'HIGH', 'MEDIUM']
    state.players = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, attr_overall: 60, contract_salary: 100, state_morale: 70, is_injured: true }))
    await climateApi.processWeek({ clubId: 'c1' })
    const combo = logs().find(l => l.source === 'COMBO')
    expect(combo.message).toMatch(/plantel reventado/)
    expect(clubWrites().some(r => r.squad_morale === 42)).toBe(true)
  })

  it('una semana liviana corta la racha de entrenamiento y no hay círculo vicioso', async () => {
    state.club.ticket_price = 10
    state.streaks = { results: [], fixtureIds: [], win: 0, loss: 0, unbeaten: 0, winless: 0 }
    state.recent = ['MEDIUM', 'HIGH', 'HIGH', 'HIGH']
    state.players = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, attr_overall: 60, contract_salary: 100, state_morale: 70, is_injured: true }))
    await climateApi.processWeek({ clubId: 'c1' })
    expect(logs().find(l => l.source === 'COMBO')).toBeUndefined()
  })

  it('el resumen de la temporada junta el estado del clima y las consecuencias por tipo', async () => {
    state.climate = { favors: 2, scandals: 0 }
    const data = await climateApi.getSeasonSummaryData('c1', 2026)
    expect(data.state).toBeTruthy()
    expect(data.counts).toEqual({})
  })
})
