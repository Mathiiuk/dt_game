import { readFileSync } from 'node:fs'

const sql = readFileSync('scripts/db/migration_season_close_progress.sql', 'utf8')

describe('migración de la marca de avance del cierre', () => {
  it('crea la tabla con seguridad por dueño y una marca por club y temporada', () => {
    expect(sql).toMatch(/create table if not exists public\.season_close_progress/i)
    expect(sql).toMatch(/enable row level security/i)
    expect(sql).toMatch(/owner_all/)
    expect(sql).toMatch(/unique|on conflict \(club_id, season_year\)/i)
  })
  it('close_season_atomic deja la marca DB_DONE en la misma transacción', () => {
    expect(sql).toMatch(/INSERT INTO season_close_progress/)
    expect(sql).toMatch(/'DB_DONE'/)
  })
  it('sin carrera también reconoce un cierre ya hecho por la marca de avance y fija el search_path', () => {
    expect(sql).toMatch(/EXISTS \(SELECT 1 FROM season_close_progress WHERE club_id = p_club_id AND season_year = p_season_year\)/)
    expect(sql).toMatch(/SET search_path = public, pg_temp/)
  })
  it('la base solo cierra una temporada terminada (semana 52)', () => {
    expect(sql).toMatch(/v_game_date < \(p_season_year \|\| '-07-01'\)::date \+ 357/)
    expect(sql).toMatch(/todavía no terminó/)
  })
})
