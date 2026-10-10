import { readFileSync } from 'node:fs'

describe('migración de la Asamblea de la AFA (reglamento del torneo)', () => {
  const sql = readFileSync('scripts/db/migration_league_rules.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('guarda el reglamento en la competición y los votos por club y año, aislados por dueño', () => {
    expect(code).toMatch(/add column if not exists rules jsonb/)
    expect(code).toMatch(/create table if not exists public\.season_rule_votes/)
    expect(code).toMatch(/unique \(club_id, season_year\)/)
    expect(code).toMatch(/enable row level security/)
    expect(code).toMatch(/owner_user_id = \(select auth\.uid\(\)\)/)
  })

  it('apply_league_match lee el reglamento y respeta todas sus reglas de puntos', () => {
    expect(code).toMatch(/create or replace function public\.apply_league_match\(/)
    for (const key of ['winPts', 'awayWinPts', 'drawPts', 'nilNilPts', 'bigWinBonus', 'cleanSheetBonus', 'lastRoundsX2']) {
      expect(code).toContain(`'${key}'`)
    }
  })

  it('los partidos de IA y del usuario pasan visitante y fecha; el premio y el cierre leen ascensos y descensos', () => {
    expect(code).toMatch(/apply_league_match\(f\.competition_id, f\.away_team_id, a, h, true, f\.round\)/)
    expect(code).toMatch(/apply_league_match\(f\.competition_id, f\.home_team_id, p_home, p_away, false, f\.round\)/)
    expect(code).toContain("rules->>\\'promoted\\'")
    expect(code).toContain("rules->>\\'relegated\\'")
  })
})
