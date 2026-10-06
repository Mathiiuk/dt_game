// Liga: los partidos de la IA los juega la base con la fuerza de cada club; el navegador no escribe resultados ni tabla
const state = { rpc: [], rpcResult: null, inserts: [], writes: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'limit']) q[m] = () => q
    q.maybeSingle = async () => ({ data: null })
    q.single = async () => ({ data: { id: 'comp1' }, error: null })
    q.insert = (rows) => {
      state.inserts.push({ table, rows })
      const out = Promise.resolve({ data: table === 'clubs' ? rows.map((_, i) => ({ id: `ai${i}` })) : null, error: null })
      out.select = () => (table === 'competitions' ? { single: async () => ({ data: { id: 'comp1' }, error: null }) } : out)
      return out
    }
    q.update = (row) => { state.writes.push({ table, row }); return q }
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { state.rpc.push({ fn, args }); return state.rpcResult(fn, args) } } }
})

import { competitionApi } from '../../src/api/competition'
import { buildRivalLineup } from '../../src/domain/matchSquad'

describe('liga con fuerza real y resultados en el servidor', () => {
  beforeEach(() => {
    state.rpc = []
    state.inserts = []
    state.writes = []
    state.rpcResult = () => ({ data: 7, error: null })
  })

  it('la fecha de la IA se juega con una sola llamada a la base, con el club del usuario y la fecha del juego', async () => {
    const n = await competitionApi.simulateMatchDay('2026-08-12T00:00:00Z', 'USER')
    expect(n).toBe(7)
    expect(state.rpc).toEqual([{ fn: 'play_league_ai_fixtures', args: { p_user_club_id: 'USER', p_date: '2026-08-12' } }])
    // El navegador no escribe resultados ni tabla
    expect(state.writes).toEqual([])
  })

  it('sin fecha o sin club no llama a la base', async () => {
    expect(await competitionApi.simulateMatchDay(null, 'USER')).toBe(0)
    expect(await competitionApi.simulateMatchDay('2026-08-12', null)).toBe(0)
    expect(state.rpc).toEqual([])
  })

  it('un error de la base no frena el avance de la semana', async () => {
    state.rpcResult = () => ({ data: null, error: { message: 'boom' } })
    expect(await competitionApi.simulateMatchDay('2026-08-12', 'USER')).toBe(0)
  })

  it('los rivales nacen con fuerza propia de 46 a 66, distinta de un club a otro y siempre la misma para la misma carrera', async () => {
    const run = async () => {
      state.inserts = []
      await competitionApi._initializeLeague('club-usuario', 'Argentina')
      return state.inserts.find(i => i.table === 'clubs').rows.map(c => c.strength)
    }
    const first = await run()
    expect(first).toHaveLength(19)
    expect(Math.min(...first)).toBeGreaterThanOrEqual(46)
    expect(Math.max(...first)).toBeLessThanOrEqual(66)
    expect(new Set(first).size).toBeGreaterThan(8)
    expect(await run()).toEqual(first)
  })

  it('el rival del usuario rinde su fuerza real; sin fuerza se estima por reputación', () => {
    expect(buildRivalLineup(15, 62).every(p => p.slot_rating === 62 && p.attr_overall === 62)).toBe(true)
    expect(buildRivalLineup(15, 48)[0].slot_rating).toBe(48)
    expect(buildRivalLineup(20)[0].slot_rating).toBe(60)
    expect(buildRivalLineup()[0].slot_rating).toBe(55)
  })
})
