// Cierre semanal del clima (barra, auditoría, eventos) y efectos de las decisiones de los dilemas
const state = {}
const writes = []
const created = []
const createdCtx = []

vi.mock('../../src/api/morale', () => ({
  moraleApi: { getStreaks: vi.fn(async () => state.streaks) }
}))

vi.mock('../../src/api/finances', () => ({
  financesApi: { moveCash: vi.fn(async (a) => { (globalThis.__cash ||= []).push(a); return { newBudget: 0 } }), recordLedgerTransaction: vi.fn(async () => {}), getFinances: vi.fn(async () => ({})) }
}))

vi.mock('../../src/api/events', () => ({
  eventsApi: { createFromTemplate: vi.fn(async (template, ctx) => { created.push(template.template_code); createdCtx.push(ctx); return true }) }
}))

const dismissals = []
vi.mock('../../src/api/board', () => ({
  boardApi: { executeManagerDismissal: vi.fn(async (...args) => { dismissals.push(args) }) }
}))

const resigned = []
vi.mock('../../src/api/career', () => ({
  careerApi: { resignFromClub: vi.fn(async (...args) => { resigned.push(args) }) }
}))

vi.mock('../../src/api/reputation', () => ({
  reputationApi: { applyReputationDelta: vi.fn(async () => {}) }
}))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    let op = 'select'
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.update = (row) => { op = 'update'; writes.push({ table, op, row }); return q }
    q.upsert = (row) => { writes.push({ table, op: 'upsert', row }); return Promise.resolve({ error: null }) }
    q.insert = (row) => { writes.push({ table, op: 'insert', row }); return Promise.resolve({ error: null }) }
    const read = () => {
      if (table === 'clubs') return state.club
      if (table === 'club_board_confidence') return state.board
      if (table === 'club_climate') return state.climate
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

const upsert = () => writes.filter(w => w.table === 'club_climate' && w.op === 'upsert').pop()?.row

describe('cierre semanal del clima', () => {
  beforeEach(() => {
    writes.length = 0
    created.length = 0
    createdCtx.length = 0
    dismissals.length = 0
    resigned.length = 0
    state.club = { fans_confidence: 20, budget: 3000 }
    state.board = { sports_satisfaction: 30, confidence_score: 50, financial_satisfaction: 70, squad_satisfaction: 70 }
    state.climate = { club_id: 'c1', pressure: 0, climate: 'FLOWS', barra_stage: 'CALM', favors: 0, scandals: 0, suspended_matches: 0, board_owed: 0 }
    state.streaks = { results: ['L', 'L', 'L', 'L'], fixtureIds: [], win: 0, loss: 4, unbeaten: 0, winless: 4 }
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
  })

  afterEach(() => vi.restoreAllMocks())

  it('una racha de derrotas con la hinchada enojada sube la presión y la barra pide', async () => {
    const res = await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(res.pressure).toBeGreaterThanOrEqual(55)
    expect(['CRISIS', 'CHAOS']).toContain(res.climate)
    expect(upsert()).toMatchObject({ barra_stage: 'ASKS' })
    expect(created).toContain('EVT_BARRA_ASKS')
  })

  it('con todo en calma no pasa nada', async () => {
    state.club = { fans_confidence: 90, budget: 30000 }
    state.board = { sports_satisfaction: 85, confidence_score: 85, financial_satisfaction: 80, squad_satisfaction: 80 }
    state.streaks = { results: ['W', 'W', 'W'], fixtureIds: [], win: 3, loss: 0, unbeaten: 3, winless: 0 }
    const res = await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(res.climate).toBe('FLOWS')
    expect(upsert().barra_stage).toBe('CALM')
    expect(created).toEqual([])
  })

  it('en la invasión con la dirigencia floja se convoca la reunión de emergencia', async () => {
    state.climate.barra_stage = 'SQUEEZES'
    state.board.confidence_score = 30
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert().barra_stage).toBe('INVASION')
    expect(created).toContain('EVT_BARRA_INVASION')
    expect(created).toContain('EVT_EMERGENCY_MEETING')
  })

  it('el primer escándalo cuesta una multa y confianza de la dirigencia; el tercero es el despido', async () => {
    state.climate.favors = 6
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert()).toMatchObject({ scandals: 1, suspended_matches: 0 })
    expect(globalThis.__cash.find(c => c.category === 'FINE' && c.amount === -1500)).toBeTruthy()
    expect(writes.some(w => w.table === 'clubs' && 'budget' in w.row)).toBe(false)
    expect(dismissals).toHaveLength(0)

    writes.length = 0
    state.climate.scandals = 2
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 11 })
    expect(dismissals).toHaveLength(1)
    expect(dismissals[0][2]).toBe('CORRUPTION_SCANDAL')
  })

  it('el segundo escándalo suspende al DT un partido', async () => {
    state.climate.favors = 6
    state.climate.scandals = 1
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert()).toMatchObject({ scandals: 2, suspended_matches: 1 })
  })

  it('sin favores aceptados no hay auditoría aunque el azar sea el peor', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert().scandals).toBeUndefined()
  })
})

describe('efectos de las decisiones de un dilema', () => {
  beforeEach(() => {
    writes.length = 0
    dismissals.length = 0
    resigned.length = 0
    state.club = { fans_confidence: 60, squad_morale: 50, board_confidence: 70, budget: 10000 }
    state.board = { sports_satisfaction: 60, financial_satisfaction: 70, squad_satisfaction: 70, confidence_score: 66 }
    state.climate = { club_id: 'c1', pressure: 60, climate: 'CRISIS', barra_stage: 'SQUEEZES', favors: 1, scandals: 0, suspended_matches: 0, board_owed: 0 }
  })

  afterEach(() => vi.restoreAllMocks())

  it('ceder a la barra baja un escalón y suma un favor', async () => {
    await climateApi.applyEventEffects({ clubId: 'c1', effects: { fans: -1, locker: 3, favors: 1, barra: -1 }, title: 'Piden entradas' })
    expect(upsert()).toMatchObject({ barra_stage: 'PRESSURES', favors: 2 })
  })

  it('derivar a la dirigencia deja una deuda de favor', async () => {
    await climateApi.applyEventEffects({ clubId: 'c1', effects: { barra: -1, board_owed: 1 }, title: 'Piden entradas' })
    expect(upsert()).toMatchObject({ board_owed: 1 })
  })

  it('ceder en la reunión de emergencia fija la confianza de la dirigencia en 20', async () => {
    await climateApi.applyEventEffects({ clubId: 'c1', effects: { favors: 3, board_set: 20, barra: -2 }, title: 'Reunión' })
    const board = writes.filter(w => w.table === 'club_board_confidence').pop().row
    expect(board.confidence_score).toBe(20)
  })

  it('renunciar cierra el ciclo con la función de renuncia del DT', async () => {
    const note = await climateApi.applyEventEffects({ clubId: 'c1', managerId: 'm1', effects: { action: 'RESIGN' }, title: 'Reunión' })
    expect(resigned).toEqual([['m1', 'c1']])
    expect(note).toMatch(/Renunciaste/)
  })

  it('plantarse: con mala suerte te echan, con buena queda un ultimátum de tres partidos', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const fired = await climateApi.applyEventEffects({ clubId: 'c1', managerId: 'm1', effects: { action: 'GAMBLE_DISMISSAL' }, title: 'Reunión' })
    expect(dismissals).toHaveLength(1)
    expect(fired).toMatch(/te vas/)

    writes.length = 0
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const kept = await climateApi.applyEventEffects({ clubId: 'c1', managerId: 'm1', effects: { action: 'GAMBLE_DISMISSAL' }, title: 'Reunión' })
    expect(dismissals).toHaveLength(1)
    expect(writes.find(w => w.row?.is_under_ultimatum)?.row).toMatchObject({ ultimatum_matches_remaining: 3, ultimatum_points_required: 4 })
    expect(kept).toMatch(/plazo/)
  })

  it('los dilemas viejos con "locker_room" también mueven el vestuario', async () => {
    await climateApi.applyEventEffects({ clubId: 'c1', effects: { locker_room: 10 }, title: 'Escándalo' })
    expect(writes.find(w => w.table === 'clubs' && w.op === 'update')?.row).toMatchObject({ squad_morale: 60 })
  })
})

describe('avisos silenciados y dificultad', () => {
  beforeEach(() => {
    writes.length = 0
    created.length = 0
    state.club = { fans_confidence: 90, budget: 30000 }
    state.board = { sports_satisfaction: 85, confidence_score: 85, financial_satisfaction: 80, squad_satisfaction: 80 }
    state.climate = { club_id: 'c1', pressure: 0, climate: 'FLOWS', barra_stage: 'CALM', favors: 0, scandals: 0, suspended_matches: 0, board_owed: 0, difficulty: 'NORMAL', muted_warnings: { TICKET_PRICE: true } }
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
  })

  afterEach(() => vi.restoreAllMocks())

  it('silenciar un aviso lo guarda sin pisar los demás', async () => {
    state.climate.muted_warnings = { TRAINING_HIGH: true }
    await climateApi.muteWarning('c1', 'TICKET_PRICE')
    expect(upsert().muted_warnings).toEqual({ TRAINING_HIGH: true, TICKET_PRICE: true })
  })

  it('al llegar a cinco victorias seguidas los avisos silenciados vuelven', async () => {
    state.streaks = { results: ['W', 'W', 'W', 'W', 'W'], fixtureIds: [], win: 5, loss: 0, unbeaten: 5, winless: 0 }
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert().muted_warnings).toEqual({})
  })

  it('con cuatro victorias siguen silenciados', async () => {
    state.streaks = { results: ['W', 'W', 'W', 'W'], fixtureIds: [], win: 4, loss: 0, unbeaten: 4, winless: 0 }
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert().muted_warnings).toBeUndefined()
  })

  it('un escándalo nuevo también los reactiva', async () => {
    state.climate.favors = 6
    state.streaks = { results: ['D'], fixtureIds: [], win: 0, loss: 0, unbeaten: 1, winless: 1 }
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert()).toMatchObject({ scandals: 1, muted_warnings: {} })
  })

  it('la dificultad elegida se guarda y se aplica enseguida', async () => {
    const d = await climateApi.saveDifficulty('c1', 'REALISTIC')
    expect(d.key).toBe('REALISTIC')
    expect(climateApi.difficulty.negative).toBe(1.3)
    expect(upsert().difficulty).toBe('REALISTIC')
    climateApi.setDifficulty('NORMAL')
  })
})

describe('personajes del club en el cierre semanal', () => {
  beforeEach(() => {
    writes.length = 0
    created.length = 0
    createdCtx.length = 0
    state.club = { fans_confidence: 20, budget: 3000 }
    state.board = { sports_satisfaction: 30, confidence_score: 50, financial_satisfaction: 70, squad_satisfaction: 70 }
    state.climate = { club_id: 'c1', pressure: 0, climate: 'FLOWS', barra_stage: 'CALM', favors: 0, scandals: 0, suspended_matches: 0, board_owed: 0, difficulty: 'NORMAL', muted_warnings: {}, characters: {} }
    state.streaks = { results: ['L', 'L', 'L', 'L'], fixtureIds: [], win: 0, loss: 4, unbeaten: 0, winless: 4 }
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
  })

  afterEach(() => vi.restoreAllMocks())

  it('la primera vez se sortean los personajes, se guardan y el evento los nombra sin recordar nada', async () => {
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    const saved = upsert().characters
    expect(saved.barra.name).toBeTruthy()
    expect(saved.barra.times).toBe(1)
    expect(createdCtx[0].characters.barra.name).toBe(saved.barra.name)
    expect(createdCtx[0].memory).toBe('')
  })

  it('cuando la barra vuelve, el evento recuerda las veces anteriores', async () => {
    state.climate.characters = { barra: { name: 'el Oso', times: 1 } }
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert().characters.barra).toEqual({ name: 'el Oso', times: 2 })
    expect(createdCtx[0].memory).toMatch(/El Oso ya vino antes/)
  })

  it('si la barra no aparece, no suma visitas pero los personajes igual quedan guardados', async () => {
    state.club = { fans_confidence: 90, budget: 30000 }
    state.board = { sports_satisfaction: 85, confidence_score: 85, financial_satisfaction: 80, squad_satisfaction: 80 }
    state.streaks = { results: ['W', 'W', 'W'], fixtureIds: [], win: 3, loss: 0, unbeaten: 3, winless: 0 }
    state.climate.characters = { barra: { name: 'el Gringo', times: 2 } }
    await climateApi.advanceWeek({ clubId: 'c1', managerId: 'm1', week: 10 })
    expect(upsert().characters.barra).toEqual({ name: 'el Gringo', times: 2 })
    expect(created).toEqual([])
  })

  it('el rencor del periodista se ajusta y se guarda dentro de los personajes', async () => {
    state.climate.characters = { journalist: { name: 'Pepe Cabrera', outlet: 'Radio del Barrio', grudge: 1 } }
    expect(await climateApi.adjustJournalistGrudge('c1', 1)).toBe(2)
    expect(upsert().characters.journalist.grudge).toBe(2)
    expect(await climateApi.adjustJournalistGrudge('c1', -5)).toBe(0)
  })
})

