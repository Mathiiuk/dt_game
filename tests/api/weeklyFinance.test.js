// Cierre semanal: lo calcula y escribe la base (close_week_finances); el navegador solo lo pide
const state = { rpc: [], rpcResult: null, writes: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'or', 'order', 'limit']) q[m] = () => q
    q.insert = (rows) => { state.writes.push({ table, rows }); return Promise.resolve({ error: null }) }
    q.update = (row) => { state.writes.push({ table, row }); return q }
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { financesApi } from '../../src/api/finances'
import { weeklyBudget } from '../../src/domain/finances'

describe('cierre semanal en el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.writes = []
    state.rpcResult = () => ({ data: { closed: true, income: 1150, expenses: 2964, board_aid: 1302, new_budget: 14000 }, error: null })
  })

  it('pide el cierre con club, temporada y semana, y no manda ningún importe', async () => {
    const res = await financesApi.processWeek({ clubId: 'c1', careerId: 'k1', seasonYear: 2026, weekNumber: 3, players: [{ contract_salary: 999999 }] })
    expect(state.rpc).toEqual([{ fn: 'close_week_finances', args: { p_club_id: 'c1', p_season_year: 2026, p_week: 3, p_career_id: 'k1' } }])
    expect(state.writes).toEqual([])
    expect(res).toEqual({ income: 2452, expenses: 2964, newBudget: 14000, boardAid: 1302, alreadyClosed: false })
  })

  it('si la semana ya estaba cerrada informa que no se cobró de nuevo', async () => {
    state.rpcResult = () => ({ data: { closed: false, already_closed: true, income: 0, expenses: 0, board_aid: 0, new_budget: 14000 }, error: null })
    const res = await financesApi.processWeek({ clubId: 'c1', seasonYear: 2026, weekNumber: 3 })
    expect(res.alreadyClosed).toBe(true)
    expect(res.newBudget).toBe(14000)
  })

  it('un rechazo de la base (club ajeno, club inexistente) corta el cierre con su mensaje', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'Club no encontrado.' } })
    await expect(financesApi.processWeek({ clubId: 'x', seasonYear: 2026, weekNumber: 3 })).rejects.toThrow('Club no encontrado.')
  })
})

// Estos valores salen de close_week_finances en la base: si cambia una fórmula, tiene que cambiar la otra
describe('paridad de la economía semanal con la base', () => {
  const players = (n, wage) => Array.from({ length: n }, () => ({ contract_salary: wage }))

  it('club inicial: reputación 20, tienda 1, estadio 1, cantera 1, plantel de 20 que cobra 130', () => {
    const w = weeklyBudget({ club: { reputation: 20, stadium_level: 1, academy_level: 1, store_level: 1 }, players: players(20, 130), staff: [] })
    expect(w.income).toEqual({ members: 280, sponsors: 560, tv: 330, store: 150 })
    expect(w.expenses).toEqual({ playerWages: 2600, staffWages: 0, stadiumMaint: 260, academyMaint: 100 })
    expect(w.totalIncome).toBe(1320)
    expect(w.totalExpenses).toBe(2960)
  })

  it('reputación 15 y tienda de nivel 3 con dos del cuerpo técnico', () => {
    const w = weeklyBudget({ club: { reputation: 15, stadium_level: 2, academy_level: 2, store_level: 3 }, players: players(18, 110), staff: [{ wage_weekly: 100 }, { salary: 80 }] })
    expect(w.income.sponsors).toBe(520)
    expect(w.income.store).toBe(450)
    expect(w.expenses.playerWages).toBe(1980)
    expect(w.expenses.staffWages).toBe(180)
    expect(w.expenses.stadiumMaint).toBe(320)
    expect(w.expenses.academyMaint).toBe(200)
  })

  it('en una categoría más alta los ingresos fijos (socios, patrocinio y TV) crecen 50% por escalón; la tienda no', () => {
    const base = { reputation: 15, stadium_level: 1, academy_level: 1, store_level: 1 }
    const w3 = weeklyBudget({ club: { ...base, league_tier: 3 }, players: [], staff: [] })
    expect(w3.income).toEqual({ members: 560, sponsors: 1040, tv: 660, store: 150 })
    const w1 = weeklyBudget({ club: { ...base, league_tier: 1 }, players: [], staff: [] })
    expect(w1.income).toEqual({ members: 840, sponsors: 1560, tv: 990, store: 150 })
    const w5 = weeklyBudget({ club: { ...base, league_tier: 5 }, players: [], staff: [] })
    expect(w5.income).toEqual({ members: 280, sponsors: 520, tv: 330, store: 150 })
  })

  it('sin sueldo cargado se toma 500 por jugador y 120 por integrante del cuerpo técnico; nivel 0 cuenta como 1', () => {
    const w = weeklyBudget({ club: { reputation: 10, stadium_level: 0, academy_level: 0, store_level: 0 }, players: [{}, {}], staff: [{}] })
    expect(w.expenses.playerWages).toBe(1000)
    expect(w.expenses.staffWages).toBe(120)
    expect(w.expenses.stadiumMaint).toBe(260)
    expect(w.income.store).toBe(150)
  })
})
