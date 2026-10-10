// Armar la liga y los partidos del año nuevo se puede repetir sin duplicar nada y sin tragarse errores
const { st } = vi.hoisted(() => ({ st: { ops: [], clubStanding: null, rows: [], deleteErr: null, insertErr: null, moversGone: false } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _t: table }
    for (const m of ['select', 'eq', 'gte', 'order', 'limit']) q[m] = () => q
    q.in = () => { q._in = true; return q }
    q.delete = () => { st.ops.push({ table, op: 'delete' }); return Object.assign(q, { then: (r) => r({ error: st.deleteErr }) }) }
    q.insert = (row) => { st.ops.push({ table, op: 'insert', row }); return Object.assign(q, { then: (r) => r({ data: [], error: st.insertErr }) }) }
    q.update = () => q
    q.maybeSingle = async () => ({ data: table === 'standings' ? st.clubStanding : null, error: null })
    q.single = async () => ({ data: { id: 'nueva' }, error: null })
    q.then = (r) => r({ data: table === 'standings' ? (q._in && st.moversGone ? [] : st.rows) : [], error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { competitionApi } from '../../src/api/competition'

const standings = [{ id: 's1', club_id: 'me', competition_id: 'comp', club: { name: 'Yo' } }, { id: 's2', club_id: 'otro', competition_id: 'comp', club: { name: 'Otro' } }]

beforeEach(() => { st.ops = []; st.clubStanding = null; st.rows = []; st.deleteErr = null; st.insertErr = null; st.moversGone = false })

describe('generateRoundRobinFixtures retomable', () => {
  it('borra primero los partidos programados desde esa fecha para no duplicar', async () => {
    await competitionApi.generateRoundRobinFixtures('comp', ['a', 'b', 'c', 'd'], '2027-08-01')
    const firstOp = st.ops[0]
    expect(firstOp).toEqual({ table: 'fixtures', op: 'delete' })
    expect(st.ops.some(o => o.op === 'insert' && o.table === 'fixtures')).toBe(true)
  })

  it('si falla el borrado o la carga, corta con el error', async () => {
    st.deleteErr = { message: 'sin permiso' }
    await expect(competitionApi.generateRoundRobinFixtures('comp', ['a', 'b'])).rejects.toThrow('sin permiso')
    st.deleteErr = null
    st.insertErr = { message: 'duplicado' }
    await expect(competitionApi.generateRoundRobinFixtures('comp', ['a', 'b'])).rejects.toThrow('duplicado')
  })
})

describe('prepareNextLeague retomable', () => {
  it('si el club ya se mudó a la liga nueva la reconoce sin crear otra', async () => {
    st.clubStanding = { competition_id: 'nueva-comp' }
    st.rows = [{ club_id: 'me' }, { club_id: 'x' }, { club_id: 'y' }]
    const res = await competitionApi.prepareNextLeague({ clubId: 'me', competitionId: 'comp', standings, oldTier: 5, newTier: 4, seasonYear: 2027 })
    expect(res).toEqual({ competitionId: 'nueva-comp', clubIds: ['me', 'x', 'y'] })
    expect(st.ops.some(o => o.table === 'competitions')).toBe(false)
  })

  it('si los que se iban ya fueron reemplazados no vuelve a crear clubes', async () => {
    const full = Array.from({ length: 20 }, (_, i) => ({ id: `s${i}`, club_id: i === 9 ? 'me' : `c${i}`, competition_id: 'comp', club: { name: `C${i}` } }))
    st.rows = full.map(s => ({ club_id: s.club_id }))
    st.moversGone = true
    const res = await competitionApi.prepareNextLeague({ clubId: 'me', competitionId: 'comp', standings: full, oldTier: 5, newTier: 5, seasonYear: 2027 })
    expect(res.competitionId).toBe('comp')
    expect(st.ops.some(o => o.table === 'clubs' && o.op === 'insert')).toBe(false)
  })
})
