// Entrenamiento semanal: lecturas anticipadas, escritura diferida y carga acumulada
const state = { reads: [], writes: [], batched: [], log: null, recent: [], plan: { general_focus: 'BALANCED', intensity_level: 'MEDIUM' } }

vi.mock('../../src/api/player', () => ({ playerApi: { batchUpdate: vi.fn(async (rows) => { state.batched.push(rows) }) } }))
vi.mock('../../src/api/climate', () => ({ climateApi: { applySquadConsequence: vi.fn(async (args) => { state.writes.push({ climate: args }) }) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _op: 'select', _filters: {} }
    q.select = () => q
    q.eq = (k, v) => { q._filters[k] = v; return q }
    q.order = () => q
    q.limit = () => q
    q.insert = async (row) => { state.writes.push({ table, row }); return { error: null } }
    q.upsert = async () => ({ error: null })
    q.maybeSingle = async () => {
      state.reads.push(table)
      if (table === 'club_training_plans') return { data: state.plan }
      return { data: state.log }
    }
    q.then = (resolve) => {
      state.reads.push(table)
      if (table === 'players') return resolve({ data: state.players, error: null })
      if (table === 'training_execution_logs') return resolve({ data: state.recent, error: null })
      return resolve({ data: [], error: null })
    }
    return q
  }
  return { supabase: { from: chain } }
})

import { trainingApi } from '../../src/api/training'

const players = [
  { id: 'a', age: 24, state_fitness: 80, attr_pace: 50, attr_passing: 50, attr_defending: 50, attr_shooting: 50, attr_potential: 80 },
  { id: 'b', age: 31, state_fitness: 80, attr_pace: 50, attr_passing: 50, attr_defending: 50, attr_shooting: 50, attr_potential: 80, is_injured: true, injury_days: 7 }
]

describe('entrenamiento semanal', () => {
  beforeEach(() => {
    state.reads = []
    state.writes = []
    state.batched = []
    state.log = null
    state.recent = []
    state.plan = { general_focus: 'BALANCED', intensity_level: 'MEDIUM' }
    state.players = players
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
  })
  afterEach(() => vi.restoreAllMocks())

  it('lee todo en una ronda y guarda a los jugadores en una llamada', async () => {
    const res = await trainingApi.processWeeklyTraining('c1', 5, null)
    expect(res.playersProcessed).toBe(2)
    expect(state.batched).toHaveLength(1)
    // el lesionado no entrena: solo entra el sano
    expect(state.batched[0].map(u => u.id)).toEqual(['a'])
    expect(state.writes.find(w => w.table === 'training_execution_logs')).toBeTruthy()
  })

  it('con las lecturas anticipadas y el plantel ya cargado no vuelve a pedir nada', async () => {
    const inputs = await trainingApi.prefetchWeekInputs('c1', 5)
    state.reads = []
    const res = await trainingApi.processWeeklyTraining('c1', 5, null, { inputs, players })
    expect(res.playersProcessed).toBe(2)
    expect(state.reads).toEqual([])
  })

  it('con escritura diferida devuelve los cambios en vez de guardar a los jugadores', async () => {
    const res = await trainingApi.processWeeklyTraining('c1', 5, null, { players, deferPlayerWrite: true })
    expect(state.batched).toEqual([])
    expect(res.playerUpdates.map(u => u.id)).toEqual(['a'])
    expect(res.playerUpdates[0]).toMatchObject({ state_fitness: 70 })
    // el registro de la semana sí se guarda
    expect(state.writes.find(w => w.table === 'training_execution_logs')).toBeTruthy()
  })

  it('si la semana ya se procesó devuelve lo hecho sin guardar nada (idempotente)', async () => {
    state.log = { focus_applied: 'BALANCED', intensity_applied: 'HIGH', injuries_sustained: 1, attributes_improved_count: 2 }
    const res = await trainingApi.processWeeklyTraining('c1', 5, null, { players, deferPlayerWrite: true })
    expect(res).toMatchObject({ idempotent: true, intensity: 'HIGH' })
    expect(state.batched).toEqual([])
    expect(state.writes).toEqual([])
  })

  it('la tercera semana seguida a intensidad alta desgasta al vestuario', async () => {
    state.plan = { general_focus: 'BALANCED', intensity_level: 'HIGH' }
    state.recent = [{ intensity_applied: 'HIGH' }, { intensity_applied: 'HIGH' }]
    await trainingApi.processWeeklyTraining('c1', 5, null, { players, deferPlayerWrite: true })
    const climate = state.writes.find(w => w.climate)?.climate
    expect(climate.source).toBe('TRAINING')
    expect(climate.effects.locker).toBe(-6)
  })

  it('sin jugadores no hace nada', async () => {
    expect(await trainingApi.processWeeklyTraining('c1', 5, null, { players: [], deferPlayerWrite: true })).toBeNull()
    expect(await trainingApi.processWeeklyTraining(null)).toBeNull()
  })
})
