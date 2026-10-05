// Columnas reales de scout_reports (consultadas en la base). Si el código escribe otra, Supabase responde 400.
const REAL_COLUMNS = ['id', 'club_id', 'player_id', 'level', 'created_at', 'updated_at', 'knowledge_level', 'perceived_ovr_min', 'perceived_ovr_max', 'perceived_potential_tier', 'pros', 'cons', 'recommended_action']

const calls = []
const state = { upsertError: null }

vi.mock('../../src/api/supabase', () => ({
  supabase: {
    from: (table) => {
      const b = {
        select: () => b,
        eq: () => b,
        update: (payload) => { calls.push({ table, op: 'update', payload }); return b },
        upsert: (payload) => { calls.push({ table, op: 'upsert', payload }); return b },
        insert: (payload) => { calls.push({ table, op: 'insert', payload }); return Promise.resolve({ error: null }) },
        single: async () => {
          if (table === 'clubs') return { data: { id: 'c1', budget: 1000 }, error: null }
          if (table === 'players') return { data: { id: 'p1', attr_pace: 70, attr_potential: 85, age: 20 }, error: null }
          if (table === 'scout_reports') return state.upsertError ? { data: null, error: { message: state.upsertError } } : { data: { id: 'r1' }, error: null }
          return { data: null, error: null }
        },
        then: (res) => res({ error: null })
      }
      return b
    }
  }
}))

import { scoutingApi } from '../../src/api/scouting'

describe('ojear jugadores', () => {
  beforeEach(() => { calls.length = 0; state.upsertError = null })

  it('sólo escribe columnas que existen en scout_reports', async () => {
    await scoutingApi.scoutPlayer('c1', 'p1', 'FULL')
    const upsert = calls.find(c => c.op === 'upsert')
    for (const key of Object.keys(upsert.payload)) expect(REAL_COLUMNS).toContain(key)
  })

  it('cobra los viáticos después de guardar el informe', async () => {
    await scoutingApi.scoutPlayer('c1', 'p1', 'FULL')
    const order = calls.filter(c => c.op === 'upsert' || (c.table === 'clubs' && c.op === 'update')).map(c => c.table)
    expect(order).toEqual(['scout_reports', 'clubs'])
    expect(calls.find(c => c.table === 'clubs' && c.op === 'update').payload.budget).toBe(700)
  })

  it('si el informe no se guarda, no se cobra nada', async () => {
    state.upsertError = 'falló'
    await expect(scoutingApi.scoutPlayer('c1', 'p1', 'FULL')).rejects.toThrow('falló')
    expect(calls.some(c => c.table === 'clubs' && c.op === 'update')).toBe(false)
  })
})
