// B4: el puesto del Inicio sale de la misma tabla ordenada que la pantalla Tabla
const table = { rows: [], fail: false }

vi.mock('../../src/api/supabase', () => {
  const chain = (t) => {
    const q = {}
    for (const m of ['select', 'eq', 'or', 'in', 'order', 'limit']) q[m] = () => q
    q.maybeSingle = async () => ({ data: null, error: null })
    q.then = (resolve) => resolve({ data: t === 'players' ? [{ id: 'p1', contract_salary: 600, contract_wage: 999 }, { id: 'p2', contract_salary: 400, contract_wage: 999 }] : t === 'staff' ? [{ wage_weekly: 150 }] : [], error: null })
    return q
  }
  return { supabase: { from: chain } }
})
vi.mock('../../src/api/levels', () => ({ levelsApi: { getLevelInfo: vi.fn(async () => ({ currentLevel: 1, title: 'DT', xpRequiredForNext: 100, progressPercent: 0 })) } }))
vi.mock('../../src/api/events', () => ({ eventsApi: { getPendingEvents: vi.fn(async () => []) } }))
vi.mock('../../src/api/competition', () => ({
  competitionApi: { getStandings: vi.fn(async () => { if (table.fail) throw new Error('fallo de red'); return table.rows }) }
}))

import { dashboardApi } from '../../src/api/dashboard'
import { queryCache } from '../../src/utils/cache'

const club = { id: 'c1', name: 'Potrero', budget: 20000, wage_budget: 3500, game_date: '2026-09-01' }
const manager = { id: 'm1', first_name: 'Mati', last_name: 'DT', xp: 0 }

describe('puesto en la liga del Inicio', () => {
  beforeEach(() => { queryCache.clear(); table.fail = false })

  it('muestra el puesto, los puntos y los jugados de la tabla ordenada', async () => {
    table.rows = [
      { club_id: 'x1', position: 1, points: 12, played: 5 },
      { club_id: 'c1', position: 2, points: 10, played: 5 },
      { club_id: 'x2', position: 3, points: 9, played: 5 }
    ]
    const overview = await dashboardApi.getOverview(club, manager)
    expect(overview.standingsSnippet).toEqual({ rank: 2, points: 10, played: 5 })
  })

  it('si la tabla no se puede leer el Inicio carga igual, sin puesto', async () => {
    table.fail = true
    const overview = await dashboardApi.getOverview(club, manager)
    expect(overview.standingsSnippet).toBeNull()
    expect(overview.clubSummary.name).toBe('Potrero')
  })
})

describe('tope de sueldos del Inicio', () => {
  beforeEach(() => { queryCache.clear(); table.fail = false; table.rows = [] })

  it('la masa salarial sale de contract_salary y suma el cuerpo técnico, igual que Finanzas', async () => {
    const overview = await dashboardApi.getOverview(club, manager)
    expect(overview.financesSummary).toMatchObject({ weeklyWageBill: 1150, wageBudget: 3500 })
  })
})
