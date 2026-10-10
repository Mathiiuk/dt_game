import { readFileSync } from 'node:fs'
import { DEFAULT_SETTINGS } from '../../src/domain/friendLeague'

describe('migración de la liga de la sala', () => {
  const sql = readFileSync('scripts/db/migration_friend_league.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('equipos y partidos solo se leen si estás en la sala y nada se escribe desde el navegador', () => {
    for (const t of ['friend_league_teams', 'friend_league_fixtures']) {
      expect(code).toContain(`alter table public.${t} enable row level security`)
      expect(code).toMatch(new RegExp(`create policy ${t}_select on public\\.${t} for select to authenticated using \\(public\\.friend_is_member`))
    }
    expect(code).not.toMatch(/create policy \w+ on public\.friend_league_\w+ for (insert|update|delete|all)/)
  })

  it('configurar, empezar y jugar son solo del creador, y empezar pide al menos 2 DT', () => {
    expect(code.match(/created_by is distinct from uid/g).length).toBe(3)
    expect(code).toMatch(/humans < 2/)
    expect(code).toMatch(/rm\.status <> 'LOBBY'/)
    expect(code).toMatch(/rm\.status <> 'PLAYING'/)
  })

  it('los ajustes se acotan en el servidor igual que en la app', () => {
    expect(code).toMatch(/least\(20, greatest\(4,/)
    expect(code).toContain("in ('FLOJOS', 'PAREJOS', 'CRACKS')")
    expect(DEFAULT_SETTINGS.teams).toBeGreaterThanOrEqual(4)
    expect(DEFAULT_SETTINGS.teams).toBeLessThanOrEqual(20)
  })

  it('los puntos usan las mismas reglas del reglamento y la fuerza real de cada club', () => {
    for (const key of ['winPts', 'awayWinPts', 'drawPts', 'nilNilPts', 'bigWinBonus', 'cleanSheetBonus', 'lastRoundsX2']) expect(code).toContain(`'${key}'`)
    expect(code).toMatch(/public\.club_strength\(t\.club_id\)/)
    expect(code).toMatch(/public\.cup_goals\(f\.id, hs, aws\)/)
  })

  it('nadie entra a una sala cuando la liga ya empezó', () => {
    expect(code).toMatch(/if st <> 'LOBBY' then raise exception 'La liga de esa sala ya empezó\.'/)
  })
})
