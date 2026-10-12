import { readFileSync } from 'node:fs'

describe('migración de la tabla pública de mejores DT', () => {
  const sql = readFileSync('scripts/db/migration_public_top_managers.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('la puede ejecutar quien no tiene sesión, y nadie más por la vía de "public"', () => {
    expect(code).toMatch(/revoke all on function public\.public_top_managers\(integer\) from public;/)
    expect(code).toMatch(/grant execute on function public\.public_top_managers\(integer\) to anon, authenticated;/)
  })

  it('solo devuelve nombre, puntos, títulos y victorias: ningún id, correo ni club', () => {
    const returns = code.match(/returns table \(([^)]*)\)/)[1]
    expect(returns).toBe('rank bigint, manager_name text, points integer, titles integer, matches_won integer')
    expect(code).not.toMatch(/auth\.users|email|user_id|owner_user_id/)
  })

  it('usa la misma fórmula de legado del juego y exige al menos 10 partidos', () => {
    expect(code).toContain('nat * 400 + intl * 800 + won * 15')
    expect(code).toContain('* 20 + rep * 10')
    expect(code).toContain('played >= 10')
  })

  it('limita la cantidad de filas y fija el search_path (security definer)', () => {
    expect(code).toContain('security definer set search_path = public')
    expect(code).toMatch(/limit least\(greatest\(coalesce\(p_limit, 5\), 1\), 20\)/)
  })

  it('es aditiva: no borra ni altera tablas', () => {
    expect(code).not.toMatch(/drop (table|column)|alter table|delete from|truncate/i)
  })
})

describe('migración del consentimiento para la tabla pública', () => {
  const sql = readFileSync('scripts/db/migration_public_ranking_consent.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('la columna arranca apagada para todos: nadie aparece sin aceptar', () => {
    expect(code).toMatch(/add column if not exists public_ranking boolean not null default false/)
  })

  it('la tabla pública solo incluye a quien aceptó', () => {
    expect(code).toMatch(/where m\.public_ranking\s+and /)
  })

  it('mantiene la privacidad de la función: sin ids ni correo, permisos y límite', () => {
    expect(code).toContain('returns table (rank bigint, manager_name text, points integer, titles integer, matches_won integer)')
    expect(code).not.toMatch(/auth\.users|email|user_id|owner_user_id/)
    expect(code).toMatch(/grant execute on function public\.public_top_managers\(integer\) to anon, authenticated;/)
    expect(code).toMatch(/limit least\(greatest\(coalesce\(p_limit, 5\), 1\), 20\)/)
  })

  it('es aditiva: solo agrega la columna', () => {
    expect(code).not.toMatch(/drop (table|column)|delete from|truncate/i)
    expect(code.match(/alter table/gi)).toHaveLength(1)
  })
})
