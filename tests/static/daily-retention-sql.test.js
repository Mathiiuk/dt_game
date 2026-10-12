import { readFileSync } from 'node:fs'

describe('migración de retención del reto del día', () => {
  const sql = readFileSync('scripts/db/migration_daily_retention.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('es aditiva: columna con valor por defecto, tabla nueva con RLS y sin políticas, nada se borra', () => {
    expect(code).toContain('add column if not exists bonus integer not null default 0')
    expect(code).toContain('alter table public.daily_starts enable row level security')
    expect(code).not.toMatch(/create policy/i)
    expect(code).not.toMatch(/drop (table|column|function)|delete from|truncate/i)
  })

  it('el reloj lo lleva el servidor: arranca una sola vez y el bonus sale de los segundos medidos allí', () => {
    expect(code).toContain('on conflict do nothing')
    expect(code).toContain('from public.daily_starts st where st.day = d and st.user_id = uid')
    expect(code).toMatch(/when secs <= 30 then 10 when secs <= 60 then 5 else 0/)
    expect(code).not.toMatch(/p_bonus|p_seconds|p_score/)
  })

  it('mantiene las firmas (las versiones anteriores de la app siguen andando) y los permisos acotados', () => {
    expect(code).toMatch(/function public\.daily_get\(\) returns jsonb/)
    expect(code).toMatch(/function public\.daily_submit\(p_choices text\[\]\) returns jsonb/)
    expect(code).toContain('revoke all on function public.daily_streak(uuid, date) from public, anon, authenticated;')
    expect(code).toContain('grant execute on function public.daily_get(), public.daily_submit(text[]) to authenticated;')
    expect(code.match(/security definer set search_path = public/g)).toHaveLength(2)
  })

  it('la racha cuenta días seguidos desde hoy o desde ayer', () => {
    expect(code).toContain('then p_day else p_day - 1 end) - (x.rn - 1)')
  })

  it('suma nueve dilemas con tres opciones, efectos y reacción, sin repetir identificador ni los existentes', () => {
    const ids = [...code.matchAll(/^\('([a-z-]+)', '/gm)].map(m => m[1])
    expect(ids).toHaveLength(9)
    expect(new Set(ids).size).toBe(9)
    const base = readFileSync('scripts/db/migration_daily_challenge.sql', 'utf8')
    for (const id of ids) expect(base).not.toContain(`('${id}',`)
    expect(code.match(/"effects":\{/g)).toHaveLength(27)
    expect(code.match(/"reaction":"/g)).toHaveLength(27)
    expect(code).toContain('on conflict (id) do nothing')
  })

  it('cada dilema es un JSON válido', () => {
    const rows = [...code.matchAll(/^\('([a-z-]+)', '((?:[^']|'')*)', '((?:[^']|'')*)', '(\[[\s\S]*?\])'\)[,\n]/gm)]
    expect(rows).toHaveLength(9)
    for (const r of rows) {
      const options = JSON.parse(r[4].replace(/''/g, "'"))
      expect(options).toHaveLength(3)
      for (const o of options) expect(Object.keys(o.effects).length).toBeGreaterThan(0)
    }
  })
})
