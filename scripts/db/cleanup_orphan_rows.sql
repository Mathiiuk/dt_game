-- Limpieza de filas sin dueño (datos de prueba anteriores a la seguridad por cuenta).
--
-- Al aplicar migration_rls_owner_isolation.sql las filas que ya existían quedaron con owner_user_id nulo: ninguna cuenta las ve
-- desde el navegador, pero siguen ocupando la base. ESTE SCRIPT BORRA ESAS FILAS. No se corre solo: se corre a pedido.
--
-- Corrida del 7/10/2026: borró 1.132 filas (60 clubes, 60 jugadores, 570 partidos y sus tablas dependientes) y dejó 0 sin dueño.
--
-- La primera versión borraba tabla por tabla en orden alfabético y fallaba por claves foráneas (clubs antes que players).
-- Esta versión hace pasadas: una tabla que otra todavía referencia se reintenta cuando esa otra ya se limpió, hasta 8 pasadas.
-- Si algo no se puede limpiar, aborta con la lista y no se borra nada (todo es una sola transacción).

do $$
declare
  t text;
  n bigint;
  total bigint := 0;
  pending text[];
  next_pending text[];
  pass int := 0;
begin
  select array_agg(c.table_name order by c.table_name) into pending
  from information_schema.columns c
  join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
  where c.table_schema = 'public' and c.column_name = 'owner_user_id';

  while coalesce(array_length(pending, 1), 0) > 0 and pass < 8 loop
    pass := pass + 1;
    next_pending := '{}';
    foreach t in array pending loop
      begin
        execute format('delete from public.%I where owner_user_id is null', t);
        get diagnostics n = row_count;
        total := total + n;
      exception when foreign_key_violation then
        next_pending := next_pending || t;
      end;
    end loop;
    pending := next_pending;
  end loop;

  if coalesce(array_length(pending, 1), 0) > 0 then raise exception 'Quedaron tablas sin limpiar: %', pending; end if;
  raise notice 'Borradas % filas en % pasadas', total, pass;
end $$;
