// "Todas las ligas": las tablas de las competiciones de la cuenta y los líderes del club, solo lectura
const { st } = vi.hoisted(() => ({ st: { comps: [], standings: [], stats: [], players: [], writes: 0, calls: [] } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = { _t: table }
    for (const m of ['select', 'eq', 'order', 'limit', 'in', 'gte']) q[m] = (...a) => { st.calls.push({ table, m, a }); return q }
    for (const m of ['insert', 'update', 'upsert', 'delete']) q[m] = () => { st.writes++; return q }
    q.then = (r) => r({
      data: table === 'competitions' ? st.comps : table === 'standings' ? st.standings : table === 'player_match_stats' ? st.stats : table === 'players' ? st.players : [],
      error: null
    })
    return q
  }
  return { supabase: { from: chain } }
})

import { competitionApi } from '../../src/api/competition'
import { queryCache } from '../../src/utils/cache'

const row = (competition_id, club_id, name, points, extra = {}) => ({ competition_id, club_id, points, played: 4, won: 1, drawn: 1, lost: 2, goals_for: 4, goals_against: 5, clubs: { name, short_name: name.slice(0, 3) }, ...extra })

describe('competitionApi.getAllLeagues', () => {
  beforeEach(() => { st.writes = 0; st.calls = []; queryCache.clear() })

  it('arma cada liga con su tabla ordenada y marca la del club', async () => {
    st.comps = [{ id: 'c4', name: 'Primera C (Argentina)', level: 4, season_year: 2027 }, { id: 'c5', name: 'Primera D (Argentina)', level: 5, season_year: 2026 }]
    st.standings = [
      row('c5', 'x', 'Viejo', 10), row('c5', 'y', 'Otro', 12),
      row('c4', 'me', 'Mi Club', 3), row('c4', 'z', 'Rival', 9)
    ]
    const leagues = await competitionApi.getAllLeagues('me')
    expect(leagues.map(l => l.competition.id)).toEqual(['c4', 'c5'])
    expect(leagues[0].current).toBe(true)
    expect(leagues[1].current).toBe(false)
    expect(leagues[0].rows.map(r => [r.position, r.clubs.name])).toEqual([[1, 'Rival'], [2, 'Mi Club']])
    expect(st.writes).toBe(0)
  })

  it('no lista competiciones vacías', async () => {
    st.comps = [{ id: 'c4', name: 'Primera C', level: 4 }, { id: 'vacia', name: 'Vieja', level: 5 }]
    st.standings = [row('c4', 'me', 'Mi Club', 3), row('c4', 'z', 'Rival', 9)]
    const leagues = await competitionApi.getAllLeagues('me')
    expect(leagues.map(l => l.competition.id)).toEqual(['c4'])
  })

  it('sin club devuelve una lista vacía', async () => {
    expect(await competitionApi.getAllLeagues(null)).toEqual([])
  })
})

describe('competitionApi.getClubLeaders', () => {
  beforeEach(() => { st.writes = 0; st.calls = []; queryCache.clear() })

  it('suma goles, asistencias y nota del club en la temporada de la fecha de juego', async () => {
    st.stats = [
      { player_id: 'a', goals: 2, assists: 0, rating: 8 },
      { player_id: 'a', goals: 1, assists: 1, rating: 7 },
      { player_id: 'b', goals: 0, assists: 2, rating: 7 }
    ]
    st.players = [{ id: 'a', first_name: 'Lucas', last_name: 'Pérez', position: 'DEL' }, { id: 'b', first_name: 'Mati', last_name: 'Gómez', position: 'MC' }]
    const out = await competitionApi.getClubLeaders('me', '2027-01-20')
    expect(out.scorers[0]).toMatchObject({ name: 'Lucas Pérez', goals: 3 })
    expect(out.assisters[0]).toMatchObject({ name: 'Mati Gómez', assists: 2 })
    // La temporada que contiene 2027-01-20 arranca el 1 de julio de 2026
    expect(st.calls.some(c => c.table === 'player_match_stats' && c.m === 'gte' && c.a[1] === '2026-07-01')).toBe(true)
    expect(st.writes).toBe(0)
  })

  it('sin club devuelve todo vacío', async () => {
    expect(await competitionApi.getClubLeaders(null, '2027-01-20')).toEqual({ scorers: [], assisters: [], best: [] })
  })
})
