// Orden del post-partido: la directiva y el clima tocan las mismas filas y van en orden; el resto corre junto
const { log, gates, step, deferred } = vi.hoisted(() => {
  const log = []
  const gates = {}
  const step = (name, result = undefined) => async () => {
    log.push(`start:${name}`)
    if (gates[name]) await gates[name].promise
    log.push(`end:${name}`)
    return result
  }
  const deferred = () => {
    let resolve
    const promise = new Promise(r => { resolve = r })
    return { promise, resolve }
  }
  return { log, gates, step, deferred }
})

const players = [
  { id: 'p1', first_name: 'A', last_name: 'Uno', position: 'PO', age: 25, attr_overall: 60, state_fitness: 90, state_morale: 70 },
  { id: 'p2', first_name: 'B', last_name: 'Dos', position: 'DC', age: 25, attr_overall: 62, state_fitness: 90, state_morale: 70 }
]

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.in = () => q
    q.update = () => q
    q.upsert = async () => { await step(`upsert:${table}`)(); return { error: null } }
    q.insert = async () => { await step(`insert:${table}`)(); return { error: null } }
    q.single = async () => ({ data: table === 'clubs' ? { budget: 1000, board_confidence: 60, stadium_capacity: 1500, ticket_price: 10, game_date: '2026-09-01' } : null })
    q.maybeSingle = async () => ({ data: null })
    q.then = (resolve) => resolve({ data: table === 'players' ? players : [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async () => ({}) } }
})

vi.mock('../../src/api/manager', () => ({ managerApi: {} }))
vi.mock('../../src/api/gameConfig', () => ({ gameConfigApi: { getNumber: async (key, fallback) => fallback } }))
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: step('auditoria') } }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: { processPostMatchPlayerStats: step('historia') } }))
vi.mock('../../src/api/achievements', () => ({ achievementsApi: { evaluateAchievements: async () => {} } }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: async () => {} } }))
vi.mock('../../src/api/morale', () => ({ moraleApi: { getStreaks: async () => ({ results: [] }) } }))
vi.mock('../../src/api/fanbase', () => ({
  fanbaseApi: {
    computeMatchAttendance: async () => ({ attendance: 800, capacityFillPercentage: 53, homeAdvantageBonus: 1.05 }),
    recordMatchAtmosphere: step('atmosfera')
  }
}))
vi.mock('../../src/api/finances', () => ({ financesApi: { recordLedgerTransaction: step('libro') } }))
vi.mock('../../src/api/stadium', () => ({ stadiumApi: { degradePitchHomeMatch: step('cesped') } }))
vi.mock('../../src/api/board', () => ({ boardApi: { updateConfidenceAfterMatch: step('directiva') } }))
vi.mock('../../src/api/climate', () => ({
  climateApi: {
    difficulty: { key: 'NORMAL', negative: 1, positive: 1 },
    applyMatchConsequences: step('clima'),
    applySquadConsequence: async () => {}
  }
}))
vi.mock('../../src/api/career', () => ({ careerApi: { recordMatchInStint: step('carrera') } }))
vi.mock('../../src/api/reputation', () => ({
  reputationApi: { applyReputationDelta: step('reputacion') },
  REPUTATION_DELTAS: { regular_win: 1, regular_loss: -1 }
}))

import { postMatchApi } from '../../src/api/postMatch'

const index = (entry) => log.indexOf(entry)
const result = { homeScore: 2, awayScore: 0, isHome: true, opponentName: 'Rival', events: [], starterIds: ['p1', 'p2'] }
const run = () => postMatchApi._processResult('m1', 'c1', result, 'f1')

describe('orden del post-partido', () => {
  beforeEach(() => {
    log.length = 0
    for (const k of Object.keys(gates)) delete gates[k]
  })

  it('la directiva va antes que el clima, y la atmósfera de la tribuna antes que ambos', async () => {
    await run()
    expect(index('end:atmosfera')).toBeLessThan(index('start:directiva'))
    expect(index('end:directiva')).toBeLessThan(index('start:clima'))
  })

  it('el libro, la auditoría, la atmósfera y el césped de la taquilla corren juntos', async () => {
    gates.libro = deferred()
    const running = run()
    await vi.waitFor(() => expect(log).toContain('start:libro'))
    // El libro está trabado pero los otros tres ya arrancaron: no se esperan entre sí
    await vi.waitFor(() => expect(log).toEqual(expect.arrayContaining(['start:auditoria', 'start:atmosfera', 'start:cesped'])))
    expect(log).not.toContain('start:directiva')
    gates.libro.resolve()
    await running
  })

  it('la carrera, la reputación, el informe del partido y la historia no esperan a la directiva', async () => {
    gates.directiva = deferred()
    const running = run()
    await vi.waitFor(() => expect(log).toContain('start:directiva'))
    await vi.waitFor(() => expect(log).toEqual(expect.arrayContaining(['end:carrera', 'end:reputacion', 'end:historia', 'end:upsert:match_reports'])))
    expect(log).not.toContain('start:clima')
    gates.directiva.resolve()
    await running
    expect(log).toContain('end:clima')
  })

  it('un paso lateral que falla no impide que el resto termine', async () => {
    const { careerApi } = await import('../../src/api/career')
    vi.spyOn(careerApi, 'recordMatchInStint').mockRejectedValue(new Error('sin carrera'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await run()
    expect(res.matchIncome).toBeGreaterThan(0)
    expect(log).toContain('end:clima')
    expect(log).toContain('end:historia')
    vi.restoreAllMocks()
  })
})
