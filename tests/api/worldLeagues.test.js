// El mundo: las otras cuatro divisiones se arman una vez por temporada, con sus 20 clubes, tabla y partidos
const { st } = vi.hoisted(() => ({ st: { existing: [], inserts: [], deletes: [], rpc: [], failStandings: false, failFixturesAfter: null, failDelete: null, rows: {}, scorers: [], nextId: 0 } }))

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
    // Borra las filas guardadas que cumplen los filtros; como en la base, `fixtures` y `standings` no se borran en cascada
    q.delete = () => {
      st.deletes.push({ table, eq: q._eq })
      return Object.assign(q, {
        then: (r) => {
          if (st.failDelete === table) return r({ error: { message: 'sin permiso' } })
          const match = (row) => Object.entries(q._eq).every(([c, v]) => row[c] === v)
          if (table === 'competitions' && ['fixtures', 'standings'].some(t => (st.rows[t] || []).some(x => x.competition_id === q._eq.id))) {
            return r({ error: { message: 'violates foreign key constraint' } })
          }
          st.rows[table] = (st.rows[table] || []).filter(x => !match(x))
          return r({ error: null })
        }
      })
    }
    q.single = async () => {
      const id = `comp${++st.nextId}`
      ;(st.rows.competitions ||= []).push({ id, ...q._ins[0] })
      return { data: { id }, error: null }
    }
    q.then = (resolve) => {
      if (q._ins) {
        if (table === 'standings' && st.failStandings) return resolve({ data: null, error: { message: 'fallo' } })
        if (table === 'fixtures' && st.failFixturesAfter != null && (st.rows.fixtures || []).length >= st.failFixturesAfter) {
          return resolve({ data: null, error: { message: 'fallo partidos' } })
        }
        const out = q._ins.map((row, i) => ({ id: `${table}${++st.nextId}-${i}`, ...row }))
        ;(st.rows[table] ||= []).push(...out)
        return resolve({ data: out.map(r => ({ id: r.id })), error: null })
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
  beforeEach(() => {
    st.existing = []; st.inserts = []; st.deletes = []; st.rpc = []; st.failStandings = false; st.failFixturesAfter = null; st.failDelete = null
    st.rows = {}; st.scorers = []; st.nextId = 0; queryCache.clear()
  })

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
    expect(fixtures.every(f => f.match_date >= '2026-07-29')).toBe(true)
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

  it('si fallan los partidos a mitad de carga borra partidos, tabla y competición', async () => {
    // Las primeras tandas de partidos entran y la siguiente falla
    st.failFixturesAfter = 200
    await expect(competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' })).rejects.toThrow('fallo partidos')
    // Se intentaron tres tandas de 100: entraron dos
    expect(st.inserts.filter(i => i.table === 'fixtures')).toHaveLength(3)
    expect(st.rows.fixtures).toEqual([])
    expect(st.rows.standings).toEqual([])
    expect(st.rows.competitions).toEqual([])
    // Los partidos y la tabla se borran antes que la competición
    const order = st.deletes.filter(d => d.eq.competition_id === 'comp1' || d.eq.id === 'comp1').map(d => d.table)
    expect(order.slice(-3)).toEqual(['fixtures', 'standings', 'competitions'])
  })

  it('si la limpieza falla lo avisa junto con el error original', async () => {
    st.failStandings = true
    st.failDelete = 'competitions'
    await expect(competitionApi.ensureWorldLeagues({ clubId: 'me', userTier: 5, gameDate: '2026-09-02' }))
      .rejects.toThrow(/No se pudo borrar la competición comp1 a medias \(competitions: sin permiso\) tras: fallo/)
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
