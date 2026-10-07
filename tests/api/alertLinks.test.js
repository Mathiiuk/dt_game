// B6: cada aviso del Inicio abre el lugar exacto donde se resuelve
const squadRows = { rows: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'or', 'in', 'order', 'limit']) q[m] = () => q
    q.maybeSingle = async () => ({ data: null, error: null })
    q.then = (resolve) => resolve({ data: table === 'players' ? squadRows.rows : [], error: null })
    return q
  }
  return { supabase: { from: chain } }
})
vi.mock('../../src/api/levels', () => ({ levelsApi: { getLevelInfo: vi.fn(async () => ({ currentLevel: 1 })) } }))
vi.mock('../../src/api/events', () => ({ eventsApi: { getPendingEvents: vi.fn(async () => []) } }))
vi.mock('../../src/api/competition', () => ({ competitionApi: { getStandings: vi.fn(async () => []) } }))

import { dashboardApi } from '../../src/api/dashboard'
import { queryCache } from '../../src/utils/cache'

const manager = { id: 'm1', first_name: 'Mati', last_name: 'DT' }
const player = (i, extra = {}) => ({ id: `p${i}`, contract_end: '2029-06-30', state_fitness: 90, state_morale: 70, ...extra })
const urlOf = (overview, id) => overview.urgentAlerts.find(a => a.id === id)?.actionUrl

describe('enlaces de los avisos del Inicio', () => {
  beforeEach(() => queryCache.clear())

  it('bajas médicas abre la Enfermería del Club; plantel corto abre el Plantel', async () => {
    squadRows.rows = [...Array.from({ length: 10 }, (_, i) => player(i)), player(10, { is_injured: true })]
    const overview = await dashboardApi.getOverview({ id: 'c1', budget: 20000, game_date: '2026-09-01' }, manager)
    expect(urlOf(overview, 'ALERT_INJURIES')).toBe('/club?tab=enfermeria')
    expect(urlOf(overview, 'ALERT_MIN_PLAYERS')).toBe('/squad')
  })

  it('contratos por vencer abre el Plantel ordenado por vencimiento y el déficit abre Finanzas', async () => {
    squadRows.rows = Array.from({ length: 12 }, (_, i) => player(i, i === 0 ? { contract_end: '2026-10-30' } : {}))
    const overview = await dashboardApi.getOverview({ id: 'c2', budget: -500, game_date: '2026-09-01' }, manager)
    expect(urlOf(overview, 'ALERT_CONTRACTS')).toBe('/squad?orden=contrato')
    expect(urlOf(overview, 'ALERT_FINANCES')).toBe('/finances')
  })
})
