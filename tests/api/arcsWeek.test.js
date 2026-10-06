// Cierre semanal con historias: entrega capítulos, registra el comienzo y avanza al resolver un evento
const state = {}
const writes = []
const created = []

vi.mock('../../src/api/morale', () => ({ moraleApi: { getStreaks: vi.fn(async () => ({ results: [], fixtureIds: [], win: 0, loss: 0, unbeaten: 0, winless: 0 })) } }))
vi.mock('../../src/api/events', () => ({
  eventsApi: {
    getPendingEvents: vi.fn(async () => state.pending),
    createFromTemplate: vi.fn(async (template) => { created.push(template); return true })
  }
}))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.upsert = (row) => { writes.push({ table, op: 'upsert', row }); return Promise.resolve({ error: null }) }
    q.insert = (row) => { writes.push({ table, op: 'insert', row }); return Promise.resolve({ error: null }) }
    q.update = (row) => { writes.push({ table, op: 'update', row }); return q }
    const read = () => (table === 'clubs' ? state.club : table === 'club_board_confidence' ? { sports_satisfaction: 70, confidence_score: 70 } : table === 'club_climate' ? state.climate : null)
    q.single = async () => ({ data: read(), error: null })
    q.maybeSingle = async () => ({ data: read(), error: null })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { climateApi } from '../../src/api/climate'

const climateSaves = () => writes.filter(w => w.table === 'club_climate' && w.op === 'upsert').map(w => w.row)

describe('historias en el cierre semanal', () => {
  beforeEach(() => {
    writes.length = 0
    created.length = 0
    state.club = { fans_confidence: 70, budget: 20000 }
    state.pending = []
    state.climate = { club_id: 'c1', barra_stage: 'CALM', favors: 0, scandals: 0, characters: {}, arcs: {}, difficulty: 'NORMAL', muted_warnings: {} }
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })
  afterEach(() => vi.restoreAllMocks())

  it('empieza una historia, crea el primer capítulo y lo anota en la bitácora', async () => {
    await climateApi.advanceWeek({ clubId: 'c1', week: 5, gameDate: '2026-09-01' })
    const chapter = created.find(t => /^ARC_/.test(t.template_code))
    expect(chapter.template_code).toMatch(/_0$/)
    expect(chapter.title).toMatch(/\(1\/4\)/)
    expect(climateSaves().at(-1).arcs.active).toMatchObject({ chapter: 0, delivered: true })
    expect(writes.some(w => w.table === 'consequence_log' && w.row.source === 'ARC' && /Empieza una historia/.test(w.row.message))).toBe(true)
  })

  it('con tres eventos pendientes no empieza ninguna', async () => {
    state.pending = [{ template_code: 'A' }, { template_code: 'B' }, { template_code: 'C' }]
    await climateApi.advanceWeek({ clubId: 'c1', week: 5, gameDate: '2026-09-01' })
    expect(created.some(t => /^ARC_/.test(t.template_code))).toBe(false)
  })

  it('resolver un capítulo guarda la marca y prepara el siguiente', async () => {
    state.climate.arcs = { active: { id: 'pibe', chapter: 0, delivered: true, wait: 0, flags: [] }, cooldown: 0, done: [] }
    await climateApi.onArcChapterResolved({ clubId: 'c1', code: 'ARC_PIBE_0', optionId: 'A', gameDate: '2026-09-01' })
    expect(climateSaves().at(-1).arcs.active).toMatchObject({ chapter: 1, delivered: false, flags: ['FICHADO'] })
  })

  it('al resolver el último capítulo la historia queda cerrada, registrada y con su año', async () => {
    state.climate.arcs = { active: { id: 'pibe', chapter: 3, delivered: true, wait: 0, flags: [] }, cooldown: 0, done: [] }
    const finished = await climateApi.onArcChapterResolved({ clubId: 'c1', code: 'ARC_PIBE_3', optionId: 'B', gameDate: '2026-09-01' })
    expect(finished.ending).toMatch(/se quedó/)
    const saved = climateSaves().at(-1).arcs
    expect(saved.active).toBeNull()
    expect(saved.done[0]).toMatchObject({ id: 'pibe', season: 2026 })
    expect(writes.some(w => w.table === 'consequence_log' && /Historia cerrada/.test(w.row.message))).toBe(true)
  })

  it('los eventos comunes no tocan las historias', async () => {
    expect(await climateApi.onArcChapterResolved({ clubId: 'c1', code: 'EVT_BARRA_ASKS', optionId: 'A' })).toBeNull()
    expect(climateSaves()).toHaveLength(0)
  })
})
