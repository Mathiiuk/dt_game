// El mundo: las otras cuatro divisiones se arman una vez por temporada, con sus 20 clubes, tabla y partidos
const { st } = vi.hoisted(() => ({ st: { existing: [], inserts: [], deletes: [], rpc: [], failStandings: false, scorers: [], nextId: 0 } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _t: table, _eq: {} }
    for (const m of ['select', 'order', 'limit', 'in', 'gte']) q[m] = () => q
    q.eq = (c, v) => { q._eq[c] = v; return q }
    q.insert = (rows) => {
      const list = Array.isArray(rows) ? rows : [rows]
      st.inserts.push({ table, rows: list })
      q._ins = list
      return q
    }
    q.delete = () => { st.deletes.push({ table }); return Object.assign(q, { then: (r) => r({ error: null }) }) }
    q.single = async () => ({ data: { id: `comp${++st.nextId}` }, error: null })
    q.then = (resolve) => {
      if (q._ins) {
        if (table === 'standings' && st.failStandings) return resolve({ data: null, error: { message: 'fallo' } })
        return resolve({ data: q._ins.map((_, i) => ({ id: `${table}${++st.nextId}-${i}` })), error: null })
      }
      if (table === 'competitions') return resolve({ data: st.existing, error: null })
      if (table === 'league_scorers') return resolve({ data: st.scorers.filter(s => s.competition_id === q._eq.competition_id), error: null })
      return resolve({ data: [], error: null })
    }
    return q
  }
  return { supabase: { from: chain, rpc: async (fn, args) => { st.rpc.push({ fn, args }); return { data: 0, error: null } } } }
})

import { competitionApi } from '../../src/api/competition'
import { queryCache } from '../../src/utils/cache'

describe('ensureWorldLeagues', () => {
  beforeEach(() => { st.existing = []; st.inserts = []; st.deletes = []; st.rpc = []; st.failStandings = false; st.scorers = []; st.nextId = 0; queryCache.clear() })

  it('arma las cuatro divisiones que el club no juega, cada una con 20 clubes de su categoría', async () => {
    const res = await competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })
    expect(res.created).toBe(4)
    const comps = st.inserts.filter(i => i.table === 'competitions').flatMap(i => i.rows)
    expect(comps.map(c => c.level)).toEqual([1, 2, 3, 4])
    expect(comps.every(c => c.season_year === 2026 && c.teams_count === 20)).toBe(true)
    const clubBatches = st.inserts.filter(i => i.table === 'clubs')
    expect(clubBatches).toHaveLength(4)
    clubBatches.forEach((b, i) => {
      expect(b.rows).toHaveLength(20)
      expect(b.rows.every(r => r.league_tier === i + 1 && r.history_type === 'bot')).toBe(true)
      expect(new Set(b.rows.map(r => r.name)).size).toBe(20)
    })
    const standings = st.inserts.filter(i => i.table === 'standings')
    expect(standings).toHaveLength(4)
    expect(standings.every(s => s.rows.length === 20)).toBe(true)
    // 380 partidos por liga (20 clubes, ida y vuelta), cargados por tandas
    const fixtures = st.inserts.filter(i => i.table === 'fixtures').flatMap(i => i.rows)
    expect(fixtures.length).toBe(4 * 380)
    expect(fixtures.every(f => f.match_date >= '2026-08-01')).toBe(true)
  })

  it('si el club juega en Primera arma de la 2 a la 5', async () => {
    await competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 1, gameDate: '2026-09-02' })
    expect(st.inserts.filter(i => i.table === 'competitions').flatMap(i => i.rows).map(c => c.level)).toEqual([2, 3, 4, 5])
  })

  it('no repite las que ya existen en esta temporada', async () => {
    st.existing = [{ id: 'x1', level: 1, season_year: 2026 }, { id: 'x2', level: 2, season_year: 2026 }]
    const res = await competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })
    expect(res.created).toBe(2)
    expect(st.inserts.filter(i => i.table === 'competitions').flatMap(i => i.rows).map(c => c.level)).toEqual([3, 4])
  })

  it('con todas armadas no escribe nada ni simula', async () => {
    st.existing = [1, 2, 3, 4].map(level => ({ id: `x${level}`, level, season_year: 2026 }))
    const res = await competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })
    expect(res.created).toBe(0)
    expect(st.inserts).toHaveLength(0)
    expect(st.rpc).toHaveLength(0)
  })

  it('al armarlas por primera vez pone al día los partidos que ya venció la fecha', async () => {
    await competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-11-04' })
    expect(st.rpc).toEqual([{ fn: 'play_league_ai_fixtures', args: { p_user_club_id: 'me', p_date: '2026-11-04' } }])
  })

  it('dos pedidos a la vez arman una sola vez', async () => {
    const [a, b] = await Promise.all([
      competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' }),
      competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })
    ])
    expect(a).toBe(b)
    expect(st.inserts.filter(i => i.table === 'competitions').flatMap(i => i.rows)).toHaveLength(4)
  })

  it('si una división falla borra la competición a medias para poder reintentar', async () => {
    st.failStandings = true
    await expect(competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })).rejects.toThrow('fallo')
    expect(st.deletes.some(d => d.table === 'competitions')).toBe(true)
  })

  it('es determinista: el mismo club y temporada arman los mismos rivales', async () => {
    await competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })
    const first = st.inserts.filter(i => i.table === 'clubs').map(b => b.rows.map(r => `${r.name}:${r.strength}`))
    st.inserts = []; st.nextId = 0
    await competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })
    expect(st.inserts.filter(i => i.table === 'clubs').map(b => b.rows.map(r => `${r.name}:${r.strength}`))).toEqual(first)
  })
})

describe('getLeagueLeaders', () => {
  beforeEach(() => { st.scorers = []; queryCache.clear() })

  it('devuelve goleadores, asistentes y figuras de cada liga', async () => {
    st.scorers = [
      { competition_id: 'c1', club_id: 'a', player_name: 'Lucas Gómez', goals: 5, assists: 1, clubs: { name: 'Alfa' } },
      { competition_id: 'c1', club_id: 'b', player_name: 'Mateo Sosa', goals: 2, assists: 6, clubs: { name: 'Beta' } },
      { competition_id: 'c2', club_id: 'c', player_name: 'Bruno Díaz', goals: 9, assists: 0, clubs: { name: 'Gama' } }
    ]
    const out = await competitionApi.getLeagueLeaders(['c1', 'c2'])
    expect(out.c1.scorers[0]).toMatchObject({ name: 'Lucas Gómez', goals: 5, clubName: 'Alfa' })
    expect(out.c1.assisters[0].name).toBe('Mateo Sosa')
    expect(out.c2.scorers[0].name).toBe('Bruno Díaz')
  })

  it('sin ligas devuelve un objeto vacío', async () => {
    expect(await competitionApi.getLeagueLeaders([])).toEqual({})
  })
})
