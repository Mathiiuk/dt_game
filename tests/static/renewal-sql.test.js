import { readFileSync } from 'node:fs'

// La migración que arregla la renovación: suma años al vencimiento que ya tiene y no pierde las protecciones del servidor
describe('migración de renovación de contratos', () => {
  const sql = readFileSync('scripts/db/migration_renewal_extends_contract.sql', 'utf8')

  it('el nuevo vencimiento se cuenta desde el vencimiento actual (o el cierre de esta temporada si ya venció), no desde el cierre de la temporada', () => {
    expect(sql).toMatch(/base_end := greatest\(coalesce\(pl\.contract_end, season_end\), season_end\)/)
    expect(sql).toMatch(/end_year := extract\(year from base_end\)::integer \+ p_years/)
    // La fórmula vieja (año de la temporada + años - 1) es la que dejaba el vencimiento igual
    expect(sql).not.toMatch(/\+ \(p_years - 1\)/)
  })

  it('conserva lo que ya tenía desplegada la función: search_path fijo y el permiso de resultado del servidor', () => {
    expect(sql).toMatch(/set search_path = public, pg_temp/)
    expect(sql).toMatch(/perform set_config\('app\.server_result', '1', true\)/)
  })

  it('sigue siendo la misma función de renovación (mismos parámetros y resultados)', () => {
    expect(sql).toMatch(/create or replace function public\.negotiate_renewal\(\s*p_player_id uuid, p_club_id uuid, p_wage numeric, p_years integer, p_role text,\s*p_release_clause numeric default null, p_bonus numeric default 0, p_week integer default 1\)/)
    for (const status of ['ACCEPTED', 'COLLAPSED', 'REJECTED']) expect(sql).toContain(`'${status}'`)
  })
})
