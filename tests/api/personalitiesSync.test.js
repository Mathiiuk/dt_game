const calls = []
const state = { players: [], existing: [], insertedOnUpsert: null }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _op: 'select' }
    q.select = () => q
    q.eq = () => q
    q.in = () => q
    q.upsert = (rows) => { q._op = 'upsert'; calls.push({ table, op: 'upsert', rows }); return q }
    q.then = (resolve) => {
      calls.push({ table, op: q._op === 'upsert' ? 'upsert-result' : 'select' })
      if (table === 'players') return resolve({ data: state.players, error: null })
      if (q._op === 'upsert') return resolve({ data: state.insertedOnUpsert, error: null })
      return resolve({ data: state.existing, error: null })
    }
    return q
  }
  return { supabase: { from: chain } }
})

import { personalitiesApi } from '../../src/api/personalities'
import { queryCache } from '../../src/utils/cache'

const squad = [
  { id: 'a', position: 'DFC', overall: 60, age: 25 },
  { id: 'b', position: 'DC', overall: 62, age: 22 }
]
const reads = () => calls.filter(c => c.op === 'select').map(c => c.table)

describe('personalidades del plantel', () => {
  beforeEach(() => {
    calls.length = 0
    queryCache.clear()
    state.players = squad
    state.existing = [{ player_id: 'a', primary_archetype: 'NATURAL_LEADER' }, { player_id: 'b', primary_archetype: 'FRAGILE' }]
    state.insertedOnUpsert = null
  })

  it('con el plantel ya cargado no lo vuelve a pedir: una sola consulta', async () => {
    const res = await personalitiesApi.syncSquadPersonalities('c1', squad)
    expect(reads()).toEqual(['player_personalities'])
    expect(res.map(p => p.personality.primary_archetype)).toEqual(['NATURAL_LEADER', 'FRAGILE'])
  })

  it('sin plantel conocido lo pide, y la segunda vez sale de la caché', async () => {
    await personalitiesApi.syncSquadPersonalities('c1')
    expect(reads()).toEqual(['players', 'player_personalities'])
    calls.length = 0
    await personalitiesApi.syncSquadPersonalities('c1')
    expect(calls).toHaveLength(0)
  })

  it('al cambiar el plantel se recalcula', async () => {
    await personalitiesApi.syncSquadPersonalities('c1', squad)
    calls.length = 0
    await personalitiesApi.syncSquadPersonalities('c1', [...squad, { id: 'c', position: 'MC', overall: 55, age: 30 }])
    expect(calls.length).toBeGreaterThan(0)
  })

  it('genera las que faltan con un solo upsert que devuelve lo insertado (sin releer)', async () => {
    state.existing = [{ player_id: 'a', primary_archetype: 'NATURAL_LEADER' }]
    state.insertedOnUpsert = [{ player_id: 'b', primary_archetype: 'SLACKER' }]
    const res = await personalitiesApi.syncSquadPersonalities('c1', squad)
    const upserts = calls.filter(c => c.op === 'upsert')
    expect(upserts).toHaveLength(1)
    expect(upserts[0].rows.map(r => r.player_id)).toEqual(['b'])
    expect(reads()).toEqual(['player_personalities'])
    expect(res.find(p => p.id === 'b').personality.primary_archetype).toBe('SLACKER')
  })

  it('si otra carga ya había insertado, lee solo las que faltan', async () => {
    state.existing = []
    state.insertedOnUpsert = [{ player_id: 'a', primary_archetype: 'AMBITIOUS' }]
    await personalitiesApi.syncSquadPersonalities('c1', squad)
    // la lectura de existentes + la de la que no devolvió el upsert
    expect(reads()).toEqual(['player_personalities', 'player_personalities'])
  })

  it('sin club o sin jugadores devuelve vacío', async () => {
    expect(await personalitiesApi.syncSquadPersonalities(null)).toEqual([])
    state.players = []
    expect(await personalitiesApi.syncSquadPersonalities('c9', [])).toEqual([])
  })
})

describe('mentorías de la semana', () => {
  it('avanza todas las mentorías activas y completa las que llegan al 100%', async () => {
    const updates = []
    vi.resetModules()
    vi.doMock('../../src/api/supabase', () => {
      const chain = (table) => {
        let op = 'select'
        const q = {}
        q.select = () => q
        q.eq = () => q
        q.single = async () => ({ data: table === 'player_personalities' ? { professionalism: 10, determination: 10, primary_archetype: 'SLACKER' } : null })
        q.update = (row) => { op = 'update'; updates.push({ table, row }); return q }
        q.insert = async () => ({ error: null })
        q.then = (resolve) => resolve(op === 'update'
          ? { error: null }
          : { data: table === 'player_mentorships'
            ? [{ id: 'm1', progress_percentage: 50, youth_player_id: 'y1', veteran_player_id: 'v1' }, { id: 'm2', progress_percentage: 97, youth_player_id: 'y2', veteran_player_id: 'v2' }]
            : [], error: null })
        return q
      }
      return { supabase: { from: chain } }
    })
    const { personalitiesApi: api } = await import('../../src/api/personalities')
    await api.advanceMentorshipsWeek('c1')
    expect(updates.find(u => u.table === 'player_mentorships' && u.row.progress_percentage === 55)).toBeTruthy()
    expect(updates.find(u => u.table === 'player_mentorships' && u.row.status === 'COMPLETED')).toBeTruthy()
    const shaped = updates.find(u => u.table === 'player_personalities')
    expect(shaped.row).toMatchObject({ professionalism: 14, determination: 13, primary_archetype: 'STREET_RESILIENT' })
    vi.doUnmock('../../src/api/supabase')
  })
})
