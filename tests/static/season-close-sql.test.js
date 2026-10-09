import { readFileSync } from 'node:fs'

// Cierre de temporada en el servidor: tres errores que impedían cerrar cualquier temporada ("Error al procesar el cierre de temporada")
describe('migración del cierre de temporada', () => {
  const sql = readFileSync('scripts/db/migration_season_close_ordinality.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('la posición del club se lee de la columna `ordinality` (no existe una columna `ord`)', () => {
    expect(code).toMatch(/SELECT ordinality::int INTO v_user_position/)
    expect(code).not.toMatch(/SELECT ord INTO/)
  })

  it('el premio de la temporada se lee como jsonb, clave por clave (settle_season_prize no devuelve una fila con columnas)', () => {
    expect(code).toMatch(/v_prize := settle_season_prize\(p_club_id, p_season_year, p_career_id\)/)
    for (const key of ['total', 'new_tier', 'old_tier', 'new_budget', 'new_wage_budget', 'top_scorer_player_id', 'top_scorer_goals']) {
      expect(code).toContain(`v_prize->>'${key}'`)
    }
    expect(code).not.toMatch(/v_prize_result/)
  })

  it('la hemeroteca se escribe en `club_hemeroteca` (la tabla `hemeroteca_articles` no existe)', () => {
    expect(code).toMatch(/INSERT INTO club_hemeroteca \(club_id, season_year, headline, snippet, media_source, tag\)/)
    expect(code).not.toMatch(/hemeroteca_articles/)
  })

  it('sigue siendo la función que usa la app, con sus tres parámetros y el aviso de temporada ya cerrada', () => {
    expect(code).toMatch(/CREATE OR REPLACE FUNCTION public\.close_season_atomic\(\s*p_club_id uuid,\s*p_season_year integer,\s*p_career_id uuid DEFAULT NULL\s*\) RETURNS jsonb/)
    expect(code).toContain("jsonb_build_object('alreadyClosed', true)")
    for (const key of ['userPosition', 'isPromoted', 'totalPrizeAwarded', 'newBudget', 'newWageBudget', 'newTier', 'oldTier', 'expiredCount', 'newSeasonYear', 'standingsJson']) {
      expect(code).toContain(`'${key}'`)
    }
  })
})
