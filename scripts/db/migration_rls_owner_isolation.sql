-- Aislamiento por dueño (Fase 5): cada fila pertenece a la cuenta que la creó y solo esa cuenta la ve y la modifica.
--
-- Cada carrera es un universo propio (su liga, sus rivales, su mercado): ninguna cuenta necesita ver filas de otra.
-- Por eso alcanza con una columna `owner_user_id` que toma por defecto el usuario autenticado y una política única.
-- Las funciones del juego (batch_*, apply_standings_deltas...) son SECURITY INVOKER: respetan estas políticas.
--
-- Qué NO protege: una cuenta puede alterar los datos de su propio club (el cálculo sigue en el navegador).
-- Los resultados que deben ser autoritativos van en funciones del servidor (ver migration_server_results.sql).

do $$
declare
  t text;
  pol record;
  -- Tablas con su propio esquema de dueño (user_id) o de configuración pública
  skip text[] := array['game_config', 'level_config', 'league_tiers_config', 'game_data_migrations', 'managers', 'careers', 'user_sessions', 'security_audit_log'];
begin
  drop table if exists public.players_backup_positions_v1;

  for t in select tablename from pg_tables where schemaname = 'public' and tablename <> all(skip) loop
    execute format('alter table public.%I add column if not exists owner_user_id uuid not null default auth.uid()', t);
    execute format('create index if not exists %I on public.%I (owner_user_id)', 'idx_' || left(t, 40) || '_owner', t);
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy owner_all on public.%I for all to authenticated using (owner_user_id = (select auth.uid())) with check (owner_user_id = (select auth.uid()))',
      t
    );
  end loop;

  -- Cuentas con user_id propio
  for pol in select tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('user_sessions', 'security_audit_log') loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
  create policy own_rows on public.user_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  create policy own_insert on public.security_audit_log for insert to authenticated with check (user_id = (select auth.uid()));
  create policy own_select on public.security_audit_log for select to authenticated using (user_id = (select auth.uid()));

  -- Configuración del juego: solo lectura para todos, sin escrituras desde el navegador
  for t in select unnest(array['game_config', 'level_config', 'league_tiers_config']) loop
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy read_only on public.%I for select to anon, authenticated using (true)', t);
  end loop;

  -- Registro de migraciones: sin acceso desde el navegador
  alter table public.game_data_migrations enable row level security;
end $$;

-- Defensa en profundidad: la clave pública sin sesión no puede tocar tablas ni funciones
revoke all on all tables in schema public from anon;
grant select on public.game_config, public.level_config, public.league_tiers_config to anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
