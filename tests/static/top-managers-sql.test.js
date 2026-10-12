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

describe('migración de las leyendas de la tabla pública', () => {
  const sql = readFileSync('scripts/db/migration_legend_managers.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('guarda cinco leyendas con su cantidad de títulos y sin nombres de clubes', () => {
    const names = [...code.matchAll(/^\('([^']+)', '([^']+)',/gm)].map(m => m[1])
    expect(names).toHaveLength(5)
    expect(new Set(names).size).toBe(5)
    expect(code).not.toMatch(/Boca|River|Vélez|Velez|Inter|Barcelona|Madrid|Roma|San Lorenzo|Corinthians|Hilal/i)
  })

  it('la tabla tiene RLS y ninguna política; solo se lee con la función', () => {
    expect(code).toContain('alter table public.legend_managers enable row level security')
    expect(code).not.toMatch(/create policy/i)
  })

  it('el puntaje de las leyendas es de 600 puntos por título (promedio de la fórmula de los DT)', () => {
    expect(code).toContain('l.titles * 600 as pts')
  })

  it('la función devuelve la marca de leyenda, mezcla leyendas y DT con consentimiento y mantiene los permisos', () => {
    expect(code).toContain('returns table (rank bigint, manager_name text, points integer, titles integer, matches_won integer, is_legend boolean)')
    expect(code).toMatch(/where m\.public_ranking\s+and /)
    expect(code).toMatch(/grant execute on function public\.public_top_managers_v2\(integer\) to anon, authenticated;/)
    expect(code).not.toMatch(/auth\.users|email|user_id|owner_user_id/)
  })

  it('es aditiva: crea una tabla nueva y agrega una función nueva', () => {
    expect(code).not.toMatch(/drop (table|column)|delete from|truncate|alter table public\.(managers|clubs)/i)
  })
})

describe('migración del perfil público del DT', () => {
  const sql = readFileSync('scripts/db/migration_public_profile.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('es aditiva: columna nueva, índice único parcial y funciones nuevas, sin tocar lo existente', () => {
    expect(code).toContain('add column if not exists public_slug text')
    expect(code).toMatch(/create unique index if not exists managers_public_slug_key on public\.managers \(public_slug\) where public_slug is not null/)
    expect(code).not.toMatch(/drop (table|column|function)|delete from|truncate|public_ranking boolean/i)
  })

  it('el perfil y la tabla solo muestran a quien aceptó, y no exponen datos de la cuenta', () => {
    expect(code.match(/where m\.public_ranking\s+and /g)).toHaveLength(2)
    expect(code).not.toMatch(/auth\.users|email|c\.name|stadium|owner_user_id/)
    const profile = code.slice(code.indexOf('function public.public_manager_profile'), code.indexOf('function public.public_top_managers_v3'))
    expect(profile).toContain('returns table (manager_name text, points integer')
    const returns = profile.slice(profile.indexOf('returns table'), profile.indexOf('language sql'))
    expect(returns).not.toMatch(/\bid\b|uuid|user_id|slug/)
  })

  it('la dirección solo la genera quien está conectado y aceptó; los permisos están acotados', () => {
    expect(code).toContain('where user_id = auth.uid()')
    expect(code).toContain('if m.id is null or not m.public_ranking then return null; end if;')
    expect(code).toContain('revoke all on function public.claim_public_slug() from public, anon;')
    expect(code).toContain('grant execute on function public.claim_public_slug() to authenticated;')
    expect(code).toContain('grant execute on function public.public_manager_profile(text) to anon, authenticated;')
    expect(code).toContain('grant execute on function public.public_top_managers_v3(integer) to anon, authenticated;')
  })

  it('el puesto del perfil cuenta a las leyendas con la misma regla de 600 puntos por título', () => {
    expect(code).toContain('l.titles * 600 > s.pts')
  })
})

describe('migración del camino a la leyenda', () => {
  const sql = readFileSync('scripts/db/migration_legend_road.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('es solo lectura, aditiva y exige sesión; solo la ve quien está conectado', () => {
    expect(code).toContain('create or replace function public.legend_road()')
    expect(code).toContain('if uid is null then raise exception')
    expect(code).toContain('where m.user_id = uid')
    expect(code).not.toMatch(/\b(insert|update|delete|drop|alter|truncate)\b/i)
    expect(code).toContain('revoke all on function public.legend_road() from public, anon;')
    expect(code).toContain('grant execute on function public.legend_road() to authenticated;')
  })

  it('usa la misma fórmula que la tabla pública y las leyendas valen 600 puntos por título', () => {
    expect(code).toContain('b.nat * 400 + b.intl * 800 + b.won * 15')
    expect(code).toContain('l.titles * 600')
  })

  it('no expone datos de la cuenta', () => {
    expect(code).not.toMatch(/email|auth\.users|c\.name|stadium/)
  })
})
