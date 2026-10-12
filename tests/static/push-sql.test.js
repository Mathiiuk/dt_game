import { readFileSync } from 'node:fs'

describe('migración de notificaciones push', () => {
  const sql = readFileSync('scripts/db/migration_push.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('todas las tablas tienen RLS y el navegador solo puede leer lo suyo (la configuración y la bandeja, nada)', () => {
    for (const t of ['push_config', 'push_subscriptions', 'push_prefs', 'push_outbox', 'push_news']) expect(code).toContain(`alter table public.${t} enable row level security`)
    expect(code).toMatch(/create policy push_subscriptions_select on public\.push_subscriptions for select to authenticated using \(user_id = \(select auth\.uid\(\)\)\)/)
    expect(code).toMatch(/create policy push_prefs_select on public\.push_prefs for select to authenticated using \(user_id = \(select auth\.uid\(\)\)\)/)
    expect(code).not.toMatch(/create policy \w+ on public\.push_(config|outbox|news)/)
    expect(code).not.toMatch(/create policy \w+ on public\.push_\w+ for (insert|update|all)/)
  })

  it('al borrar la cuenta se borran las suscripciones, preferencias y bandeja', () => {
    expect(code.match(/references auth\.users\(id\) on delete cascade/g)).toHaveLength(3)
  })

  it('suscribirse valida el dispositivo y solo escribe para quien llama', () => {
    expect(code).toMatch(/p_endpoint !~ '\^https:\/\/'/)
    expect(code).toMatch(/auth\.uid\(\)/)
    expect(code).toContain('on conflict (endpoint) do update')
  })

  it('"qué avisar" solo lo puede ejecutar el servicio y reclama cada aviso para no repetirlo ni de noche', () => {
    expect(code).toMatch(/grant execute on function public\.push_due\(\) to service_role/)
    const grants = code.match(/grant execute on function [^;]*to authenticated;/g)
    expect(grants).toHaveLength(1)
    expect(grants[0]).not.toContain('push_due')
    expect(code).toContain('on conflict (user_id, dedupe_key) do nothing')
    expect(code).toContain("'America/Argentina/Buenos_Aires'")
    expect(code).toMatch(/local_hour < 9 or local_hour >= 22/)
  })

  it('el cron llama cada 15 minutos con la clave interna que sale de la propia base', () => {
    expect(code).toContain("'*/15 * * * *'")
    expect(code).toMatch(/select internal_key from public\.push_config/)
  })
})

describe('migración de avisos con motivo', () => {
  const sql = readFileSync('scripts/db/migration_push_motivos.sql', 'utf8')
  const code = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')

  it('amplía push_due sin tocar permisos: solo el servicio la ejecuta', () => {
    expect(code).toContain('create or replace function public.push_due()')
    expect(code).toMatch(/grant execute on function public\.push_due\(\) to service_role/)
    expect(code.match(/^grant .*;$/gm)).toEqual(['grant execute on function public.push_due() to service_role;'])
  })

  it('revoca EXECUTE a authenticated: push_due devuelve datos ajenos y reclama avisos', () => {
    expect(code).toMatch(/revoke all on function public\.push_due\(\) from public, anon, authenticated;/)
  })

  it('suma lesión y contratos, se reclaman sin repetir y siguen el horario y las preferencias', () => {
    expect(code).toContain("'injury'")
    expect(code).toContain("'contract_end'")
    expect(code).toContain('on conflict (user_id, dedupe_key) do nothing')
    expect(code).toMatch(/local_hour < 9 or local_hour >= 22/)
    expect(code).toContain("when 'club' then pr.club")
  })

  it('conserva los avisos que ya existían', () => {
    for (const k of ['round_played', 'plan_missing', 'club_idle', "'news'"]) expect(code).toContain(k)
  })

  it('es aditiva: no borra ni altera tablas', () => {
    expect(code).not.toMatch(/drop (table|column)|alter table|delete from|truncate/i)
  })
})
