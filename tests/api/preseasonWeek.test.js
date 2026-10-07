// Pretemporada: el cierre semanal suma el aporte de la dirigencia y el clima trae el amistoso de la semana
const state = { ledger: [], club: null, firstFixture: null, pending: [], created: [] }

vi.mock('../../src/api/morale', () => ({ moraleApi: { getStreaks: vi.fn(async () => ({ results: [], fixtureIds: [], win: 0, loss: 0, unbeaten: 0, winless: 0 })) } }))
vi.mock('../../src/api/events', () => ({
  eventsApi: {
    getPendingEvents: vi.fn(async () => state.pending),
    createFromTemplate: vi.fn(async (template) => { state.created.push(template); return true })
  }
}))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'or', 'order', 'limit', 'update']) q[m] = () => q
    q.insert = (rows) => { if (table === 'financial_transactions_ledger') state.ledger.push(...rows); return Promise.resolve({ error: null }) }
    q.upsert = () => Promise.resolve({ error: null })
    const read = () => (table === 'clubs' ? state.club
      : table === 'club_board_confidence' ? { sports_satisfaction: 70, confidence_score: 70 }
      : table === 'club_climate' ? { club_id: 'c1', barra_stage: 'CALM', favors: 0, scandals: 0, characters: {}, arcs: { active: { id: 'pibe', chapter: 0, delivered: true, wait: 0, flags: [] }, cooldown: 0, done: [] }, difficulty: 'NORMAL', muted_warnings: {} }
      : null)
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => resolve({ data: table === 'fixtures' ? (state.firstFixture ? [{ match_date: state.firstFixture }] : []) : table === 'staff' ? [] : table === 'players' ? Array.from({ length: 20 }, () => ({ contract_salary: 130 })) : null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { financesApi } from '../../src/api/finances'
import { climateApi } from '../../src/api/climate'

const players = Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, contract_salary: 130 }))
const aidLine = () => state.ledger.find(l => l.category === 'BOARD_AID')

describe('pretemporada en el cierre semanal', () => {
  beforeEach(() => {
    state.ledger = []
    state.created = []
    state.pending = []
    state.firstFixture = '2026-08-01'
    state.club = { id: 'c1', budget: 16000, game_date: '2026-07-08', reputation: 20, fans_confidence: 70 }
  })

  it('en la semana 2 de la pretemporada llega el primer amistoso', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    await climateApi.advanceWeek({ clubId: 'c1', week: 2, gameDate: '2026-07-08' })
    vi.restoreAllMocks()
    expect(state.created.some(t => t.template_code === 'EVT_PRESEASON_FRIENDLY_1')).toBe(true)
  })

  it('en la semana 3 no hay amistoso y en la 4 llega el cuadrangular', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    await climateApi.advanceWeek({ clubId: 'c1', week: 3, gameDate: '2026-07-15' })
    expect(state.created.some(t => /PRESEASON/.test(t.template_code))).toBe(false)
    await climateApi.advanceWeek({ clubId: 'c1', week: 4, gameDate: '2026-07-22' })
    vi.restoreAllMocks()
    expect(state.created.some(t => t.template_code === 'EVT_PRESEASON_FRIENDLY_2')).toBe(true)
  })

  it('con la liga en marcha (la fecha del juego ya pasó el primer partido) no hay amistoso', async () => {
    state.firstFixture = '2026-07-01'
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    await climateApi.advanceWeek({ clubId: 'c1', week: 2, gameDate: '2026-07-08' })
    vi.restoreAllMocks()
    expect(state.created.some(t => /PRESEASON/.test(t.template_code))).toBe(false)
  })

  it('resolver la apuesta del amistoso tira la suerte y devuelve el resultado', async () => {
    const gamble = { chance: 0.5, win: { fans: 5, locker: 4 }, winNote: 'Ganaron.', lose: { fans: -2 }, loseNote: 'Perdieron.' }
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const note = await climateApi.applyEventEffects({ clubId: 'c1', effects: { action: 'GAMBLE_FRIENDLY', gamble }, title: 'Amistoso' })
    vi.restoreAllMocks()
    expect(note).toBe('Ganaron.')
  })

  it('en pretemporada la liquidez cuenta el aporte de la dirigencia y no una taquilla que todavía no hay', async () => {
    const { queryCache } = await import('../../src/utils/cache')
    queryCache.clear()
    state.club = { id: 'c1', budget: 8000, game_date: '2026-07-22', reputation: 20, ticket_price: 10, stadium_capacity: 1500 }
    const f = await financesApi.getFinances('c1')
    expect(f.preseason).toBe(true)
    expect(f.boardAid).toBeGreaterThanOrEqual(0)
    expect(f.expectedWeeklyFlow).toBe(f.netWeeklyFlow + f.boardAid)
    expect(f.liquidityWeeks).not.toMatch(/Superavitario|[<>]/)
  })

  it('con la liga en marcha la taquilla vuelve a entrar en la cuenta', async () => {
    const { queryCache } = await import('../../src/utils/cache')
    queryCache.clear()
    state.club = { id: 'c1', budget: 8000, game_date: '2026-09-05', reputation: 20, ticket_price: 10, stadium_capacity: 1500 }
    const f = await financesApi.getFinances('c1')
    expect(f.preseason).toBe(false)
    expect(f.expectedWeeklyFlow).toBeGreaterThan(f.netWeeklyFlow)
  })
})

