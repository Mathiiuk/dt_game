// Los hitos no se duplican: leer no escribe y registrar usa upsert con ignoreDuplicates
const calls = []
const state = { milestones: [] }

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.order = () => q
    q.single = async () => ({ data: table === 'clubs' ? { name: 'Potrero', founded_year: 2026, city: 'Rosario' } : null, error: null })
    q.maybeSingle = async () => ({ data: null, error: null })
    q.insert = (row) => { calls.push({ table, op: 'insert', row }); return q }
    q.upsert = (row, opts) => { calls.push({ table, op: 'upsert', row, opts }); return q }
    q.then = (resolve) => resolve({ data: table === 'club_milestones' ? state.milestones : [], error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { clubHistoryApi, foundationMilestone } from '../../src/api/clubHistory'

describe('hitos del club', () => {
  beforeEach(() => { calls.length = 0; state.milestones = [] })

  it('consultar la historia de un club sin hitos NO inserta nada (antes lo duplicaban dos pantallas a la vez)', async () => {
    const [a, b] = await Promise.all([clubHistoryApi.getClubMilestones('c1'), clubHistoryApi.getClubMilestones('c1')])
    expect(calls.filter(c => c.op === 'insert' || c.op === 'upsert')).toEqual([])
    expect(a[0].title).toBe('Fundación Oficial del Club')
    expect(b).toHaveLength(1)
  })

  it('registrar un hito usa upsert que ignora duplicados por (club, año, título)', async () => {
    await clubHistoryApi.addMilestone('c1', { year: 2026, title: 'Nuevo ídolo' })
    await clubHistoryApi.addMilestone('c1', { year: 2026, title: 'Nuevo ídolo' })
    const writes = calls.filter(c => c.table === 'club_milestones')
    expect(writes).toHaveLength(2)
    for (const w of writes) {
      expect(w.op).toBe('upsert')
      expect(w.opts).toEqual({ onConflict: 'club_id,year,title', ignoreDuplicates: true })
    }
  })

  it('el hito de fundación es un dato puro con el año del club', () => {
    const m = foundationMilestone('c1', { name: 'Potrero', founded_year: 2030, city: 'Rosario' })
    expect(m).toMatchObject({ club_id: 'c1', year: 2030, category: 'foundation', importance: 5 })
  })
})
