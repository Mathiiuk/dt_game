// Cambiar de club no lleva al DT a una temporada que ya pasó: el club nuevo toma la fecha de la carrera y juega la liga del año
const db = {}
let seq = 0

vi.mock('../../src/api/supabase', () => {
  // Base en memoria con los filtros que usan estas funciones
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
        const list = (Array.isArray(payload) ? payload : [payload]).map(r => ({ id: `${table}-${++seq}`, ...r }))
        rows().push(...list)
        return { data: list, error: null }
      }
      if (op === 'update') {
        rows().filter(match).forEach(r => Object.assign(r, payload))
        return { data: null, error: null }
      }
      if (op === 'delete') {
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
  return { supabase: { from, rpc: async () => ({ data: null, error: null }) } }
})
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn() } }))
vi.mock('../../src/api/leagueVote', () => ({ leagueVoteApi: { getRules: async () => null } }))

import { careerApi } from '../../src/api/career'

const scheduled = (competition_id, home, away, match_date) => ({ id: `f-${++seq}`, competition_id, home_team_id: home, away_team_id: away, match_date, status: 'SCHEDULED' })

function seed({ careerDate = '2027-07-01', worldLeague2027 = false } = {}) {
  for (const k of Object.keys(db)) delete db[k]
  db.clubs = [
    { id: 'potrero', name: 'Potrero', game_date: careerDate, league_tier: 5, history_type: 'potrero', manager_id: null },
    { id: 'flandria', name: 'Flandria', game_date: '2026-08-29', league_tier: 3, history_type: 'bot', manager_id: null }
  ]
  db.manager_career_stints = [{ manager_id: 'm1', club_id: 'potrero' }]
  // Flandria quedó en la liga de 2026, ya jugada entera
  db.competitions = [{ id: 'old3', level: 3, season_year: 2026 }]
  db.standings = [{ id: 's-flandria', competition_id: 'old3', club_id: 'flandria', played: 38, points: 50 }]
  db.fixtures = [{ id: 'f-old', competition_id: 'old3', home_team_id: 'flandria', away_team_id: 'x', match_date: '2027-04-14', status: 'PLAYED' }]
  if (worldLeague2027) {
    db.competitions.push({ id: 'w3', level: 3, season_year: 2027 })
    db.clubs.push({ id: 'bot-a', name: 'Bot A', history_type: 'bot', manager_id: null }, { id: 'bot-b', name: 'Bot B', history_type: 'bot', manager_id: null })
    db.standings.push({ id: 's-a', competition_id: 'w3', club_id: 'bot-a', played: 0 }, { id: 's-b', competition_id: 'w3', club_id: 'bot-b', played: 0 })
    db.fixtures.push(scheduled('w3', 'bot-a', 'bot-b', '2027-07-29'), scheduled('w3', 'bot-b', 'bot-a', '2027-08-05'))
  }
}

describe('el club nuevo se pone al día con la carrera del DT', () => {
  it('en pretemporada: toma la fecha de la carrera y juega una liga nueva de su categoría', async () => {
    seed()
    expect(await careerApi.syncClubToCareer('m1', 'flandria')).toBe(true)
    expect(db.clubs.find(c => c.id === 'flandria').game_date).toBe('2027-07-01')
    const row = db.standings.find(s => s.club_id === 'flandria')
    const comp = db.competitions.find(c => c.id === row.competition_id)
    expect(comp).toMatchObject({ level: 3, season_year: 2027 })
    expect(row.played).toBe(0)
    // 20 clubes y sus partidos desde el arranque de la liga 2027; la fila de 2026 ya no es la del club
    expect(db.standings.filter(s => s.competition_id === comp.id)).toHaveLength(20)
    const mine = db.fixtures.filter(f => f.competition_id === comp.id && (f.home_team_id === 'flandria' || f.away_team_id === 'flandria'))
    expect(mine).toHaveLength(38)
    expect(mine.every(f => f.status === 'SCHEDULED' && f.match_date >= '2027-07-29')).toBe(true)
  })

  it('si el mundo ya armó la liga de esa categoría, ocupa el lugar de un club de la IA (sin liga repetida)', async () => {
    seed({ worldLeague2027: true })
    await careerApi.syncClubToCareer('m1', 'flandria')
    expect(db.competitions.filter(c => c.level === 3 && c.season_year === 2027)).toHaveLength(1)
    expect(db.standings.find(s => s.id === 's-a').club_id).toBe('flandria')
    // El reemplazado se queda con la fila vieja: cada club sigue con una sola fila
    expect(db.standings.find(s => s.id === 's-flandria').club_id).toBe('bot-a')
    const w3 = db.fixtures.filter(f => f.competition_id === 'w3')
    expect(w3.map(f => [f.home_team_id, f.away_team_id])).toEqual([['flandria', 'bot-b'], ['bot-b', 'flandria']])
  })

  it('a mitad de temporada un club sin liga en curso no puede recibir al DT', async () => {
    seed({ careerDate: '2027-10-06' })
    await expect(careerApi.syncClubToCareer('m1', 'flandria')).rejects.toThrow(/ERR_JOB_OFFER_STALE/)
    expect(db.clubs.find(c => c.id === 'flandria').game_date).toBe('2026-08-29')
  })

  it('un club con liga en curso solo cambia de fecha', async () => {
    seed({ careerDate: '2027-10-06' })
    db.fixtures.push(scheduled('old3', 'flandria', 'x', '2027-10-13'))
    await careerApi.syncClubToCareer('m1', 'flandria')
    expect(db.clubs.find(c => c.id === 'flandria').game_date).toBe('2027-10-06')
    expect(db.competitions).toHaveLength(1)
  })

  it('un club que ya está al día no se toca', async () => {
    seed()
    db.clubs.find(c => c.id === 'flandria').game_date = '2027-07-01'
    expect(await careerApi.syncClubToCareer('m1', 'flandria')).toBe(false)
    expect(db.competitions).toHaveLength(1)
  })
})

describe('las ofertas solo salen de clubes con liga en curso', () => {
  it('un club que quedó en una temporada terminada no ofrece trabajo', async () => {
    seed({ worldLeague2027: true })
    const clubs = db.clubs.filter(c => ['flandria', 'bot-a'].includes(c.id))
    const offerable = await careerApi._offerableClubs('m1', null, clubs)
    expect(offerable.map(c => c.id)).toEqual(['bot-a'])
  })
})
