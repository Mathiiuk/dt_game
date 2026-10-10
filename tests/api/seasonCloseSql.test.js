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
})
