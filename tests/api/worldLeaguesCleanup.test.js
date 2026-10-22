// Una división del mundo que falla a medio armar se borra de verdad y se vuelve a armar (antes quedaba a medias toda la temporada)
const db = {}
const fail = { fixturesAfter: Infinity }
let seq = 0
let fixtureInserts = 0

vi.mock('../../src/api/supabase', () => {
  // Base en memoria que, como la real, no deja borrar una competición con tabla o partidos (FK sin cascada)
  const from = (table) => {
    const filters = []
    let op = 'select'
    let payload = null
    let max = Infinity
    const rows = () => (db[table] ||= [])
    const match = (r) => filters.every(f => f(r))
    const withJoin = (r) => (table === 'standings' ? { ...r, clubs: (db.clubs || []).find(c => c.id === r.club_id) } : r)
    const run = () => {
      if (op === 'insert') {
        if (table === 'fixtures' && ++fixtureInserts > fail.fixturesAfter) return { data: null, error: { message: 'se cortó la red' } }
        const list = (Array.isArray(payload) ? payload : [payload]).map(r => ({ id: `${table}-${++seq}`, created_at: new Date().toISOString(), ...r }))
        rows().push(...list)
        return { data: list, error: null }
      }
      if (op === 'update') {
        rows().filter(match).forEach(r => Object.assign(r, payload))
        return { data: null, error: null }
      }
      if (op === 'delete') {
        const gone = rows().filter(match)
        if (table === 'competitions') {
          const ids = new Set(gone.map(c => c.id))
          const used = [...(db.standings || []), ...(db.fixtures || [])].some(r => ids.has(r.competition_id))
          if (used) return { data: null, error: { message: 'violates foreign key constraint' } }
        }
        db[table] = rows().filter(r => !match(r))
        return { data: null, error: null }
      }
      return { data: rows().filter(match).slice(0, max).map(withJoin), error: null }
    }
    const q = {
      select: () => q,
      insert: (p) => { op = 'insert'; payload = p; return q },
      update: (p) => { op = 'update'; payload = p; return q },
      delete: () => { op = 'delete'; return q },
      eq: (k, v) => { filters.push(r => r[k] === v); return q },
      in: (k, vs) => { filters.push(r => vs.includes(r[k])); return q },
      gte: (k, v) => { filters.push(r => String(r[k]) >= v); return q },
      order: () => q,
      limit: (n) => { max = n; return q },
      single: async () => { const res = run(); return { data: res.data?.[0] ?? null, error: res.error } },
      maybeSingle: async () => { const res = run(); return { data: res.data?.[0] ?? null, error: res.error } },
      then: (resolve, reject) => Promise.resolve(run()).then(resolve, reject)
    }
    return q
  }
  return { supabase: { from, rpc: async () => ({ data: 0, error: null }) } }
})
vi.mock('../../src/api/leagueVote', () => ({ leagueVoteApi: { getRules: async () => null } }))

import { competitionApi } from '../../src/api/competition'
import { queryCache } from '../../src/utils/cache'

const ensure = () => competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })
const levels = () => (db.competitions || []).map(c => c.level).sort()
const hourAgo = () => new Date(Date.now() - 60 * 60 * 1000).toISOString()

describe('divisiones del mundo que quedan a medias', () => {
  beforeEach(() => {
    for (const k of Object.keys(db)) delete db[k]
    fail.fixturesAfter = Infinity
    fixtureInserts = 0
    queryCache.clear()
  })

  it('si se corta en medio de los partidos se borra todo lo de esa división (partidos, tabla, clubes y competición)', async () => {
    // La primera división entra entera (4 tandas de 100 partidos) y la segunda se corta en su segunda tanda
    fail.fixturesAfter = 5
    await expect(ensure()).rejects.toThrow('se cortó la red')
    expect(levels()).toEqual([1])
    expect(db.standings).toHaveLength(20)
    expect(db.fixtures).toHaveLength(380)
    expect(db.clubs).toHaveLength(20)
  })

  it('el intento siguiente arma las que faltan', async () => {
    fail.fixturesAfter = 5
    await expect(ensure()).rejects.toThrow()
    fail.fixturesAfter = Infinity
    const res = await ensure()
    expect(res.created).toBe(3)
    expect(levels()).toEqual([1, 2, 3, 4])
    expect(db.fixtures).toHaveLength(4 * 380)
  })

  it('una división vieja que quedó con tabla y sin partidos se descarta y se vuelve a armar', async () => {
    await ensure()
    // Así quedó la Primera C de una cuenta real: 20 clubes en la tabla y ningún partido
    const c = db.competitions.find(x => x.level === 4)
    c.created_at = hourAgo()
    db.fixtures = db.fixtures.filter(f => f.competition_id !== c.id)
    const res = await ensure()
    expect(res.created).toBe(1)
    expect(db.competitions.find(x => x.id === c.id)).toBeUndefined()
    const fresh = db.competitions.find(x => x.level === 4)
    expect(db.fixtures.filter(f => f.competition_id === fresh.id)).toHaveLength(380)
    expect(db.standings.filter(s => s.competition_id === c.id)).toHaveLength(0)
  })

  it('una división recién creada sin partidos no se toca (otra pestaña puede estar armándola)', async () => {
    await ensure()
    const c = db.competitions.find(x => x.level === 4)
    db.fixtures = db.fixtures.filter(f => f.competition_id !== c.id)
    expect((await ensure()).created).toBe(0)
    expect(db.competitions.find(x => x.id === c.id)).toBeDefined()
  })

  it('nunca descarta una división donde juega un club con DT', async () => {
    await ensure()
    const c = db.competitions.find(x => x.level === 4)
    c.created_at = hourAgo()
    db.fixtures = db.fixtures.filter(f => f.competition_id !== c.id)
    db.clubs.find(x => x.id === db.standings.find(s => s.competition_id === c.id).club_id).manager_id = 'm1'
    expect((await ensure()).created).toBe(0)
    expect(db.standings.filter(s => s.competition_id === c.id)).toHaveLength(20)
  })
})
