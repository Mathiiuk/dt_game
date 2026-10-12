import { readFileSync } from 'node:fs'

describe('migración del reto del día', () => {
  const sql = readFileSync('scripts/db/migration_daily_challenge.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('las dos tablas tienen RLS y ninguna política: se accede solo con las funciones', () => {
    for (const t of ['daily_decisions', 'daily_scores']) expect(code).toContain(`alter table public.${t} enable row level security`)
    expect(code).not.toMatch(/create policy/i)
  })

  it('un intento por persona y por día, y las filas se borran con la cuenta', () => {
    expect(code).toContain('primary key (day, user_id)')
    expect(code).toContain('references auth.users(id) on delete cascade')
    expect(code).toContain('unique_violation')
  })

  it('el puntaje lo calcula el servidor: la función no recibe ningún puntaje del navegador', () => {
    expect(code).toMatch(/daily_submit\(p_choices text\[\]\)/)
    expect(code).not.toMatch(/p_score/)
  })

  it('solo las tres funciones públicas se le dan a quien tiene sesión; las auxiliares quedan internas', () => {
    expect(code).toMatch(/revoke all on function [^;]*daily_today\(\)[^;]*from public, anon, authenticated;/)
    expect(code).toMatch(/grant execute on function public\.daily_get\(\), public\.daily_submit\(text\[\]\), public\.daily_board\(boolean, date\) to authenticated;/)
    expect(code.match(/^grant .*;$/gm)).toHaveLength(1)
  })

  it('las funciones con datos ajenos exigen sesión y fijan el search_path', () => {
    expect(code.match(/(auth\.uid\(\)|uid) is null/g).length).toBeGreaterThanOrEqual(3)
    expect(code.match(/security definer set search_path = public/g)).toHaveLength(3)
  })

  it('el día es el de Buenos Aires y la tabla solo mira los últimos días', () => {
    expect(code).toContain("'America/Argentina/Buenos_Aires'")
    expect(code).toContain('public.daily_today() - 6')
  })

  it('los dilemas tienen tres opciones con efectos y reacción, y no repiten identificador', () => {
    const rows = [...code.matchAll(/^\('([a-z-]+)', '/gm)].map(m => m[1])
    expect(rows.length).toBeGreaterThanOrEqual(12)
    expect(new Set(rows).size).toBe(rows.length)
    const options = [...code.matchAll(/\{"id":"[a-z-]+","label":"[^"]+","effects":\{[^}]*\},"reaction":"/g)]
    expect(options.length).toBe(rows.length * 3)
  })

  it('es aditiva: no borra ni altera tablas existentes', () => {
    expect(code).not.toMatch(/drop (table|column)|alter table (?!public\.daily_)|delete from|truncate/i)
  })
})
