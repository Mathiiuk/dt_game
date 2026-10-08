-- Eliminar una cuenta con todos sus datos.
-- `purge_user_data(uid)` borra de TODAS las tablas de `public` lo que pertenece a esa persona:
--   · filas con owner_user_id / user_id = uid
--   · filas de sus clubes (club_id) y de sus directores técnicos (manager_id)
-- Como las tablas se referencian entre sí, repite pasadas hasta que no queda nada por borrar (o no se avanza más).
-- Solo la puede ejecutar el servicio (la Edge Function `delete-account`, que antes verifica la sesión de quien pide borrar su cuenta).
-- Con `p_dry = true` no borra nada: cuenta lo que se borraría.

create or replace function public.purge_user_data(p_uid uuid, p_dry boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clubs uuid[];
  v_managers uuid[];
  r record;
  v_pass int := 0;
  v_removed int;
  v_failed int;
  v_total int := 0;
  v_cond text;
  v_n int;
  v_errs text[];
  v_counts jsonb := '{}'::jsonb;
begin
  if p_uid is null then raise exception 'Falta el usuario'; end if;

  -- Las protecciones de resultados del servidor (caja, tabla, resultados) dejan pasar esta operación
  perform set_config('app.server_result', '1', true);

  select coalesce(array_agg(id), '{}') into v_clubs from public.clubs where owner_user_id = p_uid;
  select coalesce(array_agg(id), '{}') into v_managers from public.managers where user_id = p_uid;

  loop
    v_pass := v_pass + 1;
    v_removed := 0;
    v_failed := 0;
    v_errs := '{}';

    for r in
      select c.table_name,
             bool_or(c.column_name = 'owner_user_id') as has_owner,
             bool_or(c.column_name = 'user_id') as has_user,
             bool_or(c.column_name = 'club_id') as has_club,
             bool_or(c.column_name = 'manager_id') as has_manager
      from information_schema.columns c
      join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.table_schema = 'public'
        and t.table_type = 'BASE TABLE'
        and c.column_name in ('owner_user_id', 'user_id', 'club_id', 'manager_id')
      group by c.table_name
    loop
      v_cond := array_to_string(array_remove(array[
        case when r.has_owner then 'owner_user_id = $1' end,
        case when r.has_user then 'user_id = $1' end,
        case when r.has_club then 'club_id = any($2)' end,
        case when r.has_manager then 'manager_id = any($3)' end
      ], null), ' or ');

      begin
        if p_dry then
          execute format('select count(*) from public.%I where %s', r.table_name, v_cond) into v_n using p_uid, v_clubs, v_managers;
          if v_n > 0 then v_counts := v_counts || jsonb_build_object(r.table_name, v_n); v_total := v_total + v_n; end if;
        else
          execute format('delete from public.%I where %s', r.table_name, v_cond) using p_uid, v_clubs, v_managers;
          get diagnostics v_n = row_count;
          v_removed := v_removed + v_n;
          v_total := v_total + v_n;
        end if;
      exception when others then
        v_failed := v_failed + 1;
        v_errs := v_errs || (r.table_name || ': ' || sqlerrm);
      end;
    end loop;

    exit when p_dry or v_failed = 0 or (v_removed = 0 and v_pass > 1) or v_pass >= 12;
  end loop;

  return jsonb_build_object('dry', p_dry, 'total', v_total, 'passes', v_pass, 'tables', v_counts, 'pending_errors', to_jsonb(v_errs));
end;
$$;

revoke all on function public.purge_user_data(uuid, boolean) from public, anon, authenticated;
grant execute on function public.purge_user_data(uuid, boolean) to service_role;
