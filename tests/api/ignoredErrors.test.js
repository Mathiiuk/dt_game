// Si una consulta de lectura falla, el código no puede seguir como si no hubiera datos:
// eso duplicaba ligas y planteles y se saltaba el chequeo de fondos de una opción con costo.
const state = { writes: [], failTable: null }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    const fail = () => state.failTable === table
    for (const m of ['select', 'eq', 'order', 'limit', 'neq', 'in']) q[m] = () => q
    q.insert = (row) => { state.writes.push({ table, op: 'insert', row }); return q }
    q.update = (row) => { state.writes.push({ table, op: 'update', row }); return q }
    q.upsert = (row) => { state.writes.push({ table, op: 'upsert', row }); return q }
    q.single = async () => (fail() ? { data: null, error: { message: 'fallo de red' } } : { data: { id: 'x', budget: 5, event_type: 'E', club_id: 'c1', options: [] }, error: null })
    q.maybeSingle = async () => (fail() ? { data: null, error: { message: 'fallo de red' } } : { data: null, error: null })
    q.then = (resolve) => resolve(fail() ? { data: null, error: { message: 'fallo de red' } } : { data: [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async () => ({ data: null, error: null }) } }
})

import { playerApi } from '../../src/api/player'
import { competitionApi } from '../../src/api/competition'
import { calendarApi } from '../../src/api/calendar'

describe('errores de lectura que no se pueden ignorar', () => {
  beforeEach(() => { state.writes = []; state.failTable = null; vi.spyOn(console, 'warn').mockImplementation(() => {}) })

  it('si falla la lectura del plantel no se genera un plantel nuevo encima', async () => {
    state.failTable = 'players'
    await expect(playerApi.generateInitialSquad('c1')).rejects.toThrow('fallo de red')
    expect(state.writes.filter(w => w.table === 'players')).toEqual([])
  })

  it('si falla la lectura de la tabla del club no se crea una liga nueva', async () => {
    state.failTable = 'standings'
    await competitionApi.getStandings('c-error')
    expect(state.writes.filter(w => w.table === 'competitions')).toEqual([])
  })

  it('si falla la lectura del calendario no se inserta uno nuevo', async () => {
    state.failTable = 'career_calendar'
    const cal = await calendarApi.getOrCreateCalendar('k-error')
    expect(state.writes.filter(w => w.table === 'career_calendar' && w.op === 'insert')).toEqual([])
    expect(cal.current_week).toBe(1)
  })
})
