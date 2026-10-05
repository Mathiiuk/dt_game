// Cascada del avance semanal: los pasos independientes corren en paralelo y los que dependen entre sí, en orden
const log = []
const gates = {}
const blocks = { pending: [], cup: false, critical: false }

// Cada paso registra cuándo empieza y cuándo termina; `gates[nombre]` permite demorarlo para probar el paralelismo
const step = (name, result) => async () => {
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

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.or = () => q
    q.in = () => q
    q.lte = () => q
    q.update = () => q
    q.insert = () => Promise.resolve({ error: null })
    q.maybeSingle = async () => ({ data: null })
    q.then = (resolve) => resolve({
      data: table === 'players' ? [{ id: 'p1', state_fitness: 80, injury_days: 0, is_injured: false }] : table === 'fixtures' ? blocks.pending : [],
      error: null
    })
    return q
  }
  return { supabase: { from: chain } }
})

vi.mock('../../src/api/internationalCup', () => ({ internationalCupApi: { hasDueUserMatch: async () => blocks.cup } }))
vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: (...a) => step('jugadores.guardar')() } }))
vi.mock('../../src/api/training', () => ({ trainingApi: { processWeeklyTraining: (...a) => step('entrenamiento')() } }))
vi.mock('../../src/api/injuries', () => ({ injuriesApi: { processWeeklyInjuriesRecovery: (...a) => step('lesiones')() } }))
vi.mock('../../src/api/personalities', () => ({ personalitiesApi: { advanceMentorshipsWeek: (...a) => step('mentorias')() } }))
vi.mock('../../src/api/competition', () => ({ competitionApi: { simulateMatchDay: (...a) => step('liga-ia')() } }))
vi.mock('../../src/api/stadium', () => ({ stadiumApi: { advanceConstructionWeek: (...a) => step('estadio')() } }))
vi.mock('../../src/api/career', () => ({ careerApi: { processWeeklyManagerProgression: (...a) => step('carrera')() } }))
vi.mock('../../src/api/finances', () => ({ financesApi: { processWeek: (...a) => step('finanzas')() } }))
vi.mock('../../src/api/contracts', () => ({ contractApi: { generateRandomOffersForWeek: (...a) => step('ofertas')() } }))
vi.mock('../../src/api/morale', () => ({ moraleApi: { processWeeklyMorale: (...a) => step('moral')() } }))
vi.mock('../../src/api/climate', () => ({
  climateApi: {
    processWeek: (...a) => step('clima')(),
    advanceWeek: (...a) => step('clima-barra')()
  }
}))
vi.mock('../../src/api/events', () => ({
  eventsApi: {
    hasCriticalPendingEvent: async () => blocks.critical,
    generateWeeklyEvents: (...a) => step('eventos')()
  }
}))

import { calendarApi } from '../../src/api/calendar'

const calendar = { id: 'virtual-calendar', career_id: null, current_week: 5, current_date: '2026-08-05', current_season_year: 2026, is_advancing: false }
const index = (entry) => log.indexOf(entry)

describe('cascada del avance semanal', () => {
  beforeEach(() => {
    log.length = 0
    for (const k of Object.keys(gates)) delete gates[k]
    Object.assign(blocks, { pending: [], cup: false, critical: false })
    vi.spyOn(calendarApi, 'getOrCreateCalendar').mockResolvedValue({ ...calendar })
    vi.spyOn(calendarApi, 'reconcileWithClub').mockImplementation(async (c) => c)
  })

  afterEach(() => vi.restoreAllMocks())

  const advance = () => calendarApi.advanceWeek({ careerId: null, clubId: 'c1', managerId: 'm1' })

  it('ejecuta todos los pasos de la semana y devuelve el tiempo de cada uno', async () => {
    const res = await advance()
    expect(res.success).toBe(true)
    for (const name of ['entrenamiento', 'lesiones', 'mentorias', 'liga-ia', 'estadio', 'carrera', 'finanzas', 'ofertas', 'moral', 'clima', 'clima-barra', 'eventos']) {
      expect(log).toContain(`end:${name}`)
    }
    expect(Object.keys(res.timings)).toEqual(expect.arrayContaining(['total', 'semana.liga-ia', 'semana.finanzas', 'semana.cadena-jugadores']))
  })

  it('la liga de la IA, el estadio y la carrera no esperan a la cadena de jugadores', async () => {
    gates['jugadores.guardar'] = deferred()
    const running = advance()
    await vi.waitFor(() => expect(log).toContain('start:jugadores.guardar'))
    // Mientras la cadena de jugadores sigue trabada, los independientes ya arrancaron y terminaron
    await vi.waitFor(() => expect(log).toEqual(expect.arrayContaining(['end:liga-ia', 'end:estadio', 'end:carrera'])))
    expect(log).not.toContain('start:entrenamiento')
    expect(log).not.toContain('start:finanzas')
    gates['jugadores.guardar'].resolve()
    await running
  })

  it('el entrenamiento va después de guardar a los jugadores, y las lesiones y mentorías después del entrenamiento', async () => {
    await advance()
    expect(index('end:jugadores.guardar')).toBeLessThan(index('start:entrenamiento'))
    expect(index('end:entrenamiento')).toBeLessThan(index('start:lesiones'))
    expect(index('end:lesiones')).toBeLessThan(index('start:mentorias'))
  })

  it('finanzas, ofertas y moral esperan a toda la cadena de jugadores y corren juntas', async () => {
    gates.finanzas = deferred()
    const running = advance()
    await vi.waitFor(() => expect(log).toContain('start:finanzas'))
    // Finanzas está trabada pero moral y ofertas ya corrieron: no se esperan entre sí
    await vi.waitFor(() => expect(log).toEqual(expect.arrayContaining(['end:moral', 'end:ofertas'])))
    expect(index('end:mentorias')).toBeLessThan(index('start:finanzas'))
    expect(log).not.toContain('start:clima')
    gates.finanzas.resolve()
    await running
  })

  it('el clima lee la caja y la moral: va después de finanzas y moral, y los eventos al final', async () => {
    await advance()
    expect(index('end:finanzas')).toBeLessThan(index('start:clima'))
    expect(index('end:moral')).toBeLessThan(index('start:clima'))
    expect(index('end:clima')).toBeLessThan(index('start:clima-barra'))
    expect(index('end:clima-barra')).toBeLessThan(index('start:eventos'))
  })

  it('un paso opcional que falla no frena el avance', async () => {
    const { stadiumApi } = await import('../../src/api/stadium')
    vi.spyOn(stadiumApi, 'advanceConstructionWeek').mockRejectedValue(new Error('sin obras'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await advance()
    expect(res.success).toBe(true)
    expect(log).toContain('end:eventos')
  })

  describe('condiciones previas', () => {
    const fails = async () => { try { await advance() } catch (e) { return e } return null }

    it('un partido de liga pendiente frena el avance y no se procesa nada', async () => {
      blocks.pending = [{ id: 'f1' }]
      const err = await fails()
      expect(err.code).toBe('ERR_MATCH_MUST_BE_PLAYED_FIRST')
      expect(log).toEqual([])
    })

    it('un partido de copa pendiente también frena el avance', async () => {
      blocks.cup = true
      const err = await fails()
      expect(err.code).toBe('ERR_MATCH_MUST_BE_PLAYED_FIRST')
      expect(err.message).toMatch(/copa/)
      expect(log).toEqual([])
    })

    it('un dilema crítico sin resolver frena el avance', async () => {
      blocks.critical = true
      const err = await fails()
      expect(err.code).toBe('ERR_CRITICAL_EVENT_PENDING')
      expect(log).toEqual([])
    })

    it('si hay varias condiciones, manda la misma prioridad de siempre: liga, copa y dilema', async () => {
      Object.assign(blocks, { pending: [{ id: 'f1' }], cup: true, critical: true })
      expect((await fails()).message).toMatch(/partido oficial/)
      blocks.pending = []
      expect((await fails()).message).toMatch(/copa/)
      blocks.cup = false
      expect((await fails()).code).toBe('ERR_CRITICAL_EVENT_PENDING')
    })
  })
})

