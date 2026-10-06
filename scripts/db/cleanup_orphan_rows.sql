-- Limpieza de filas sin dueño (datos de prueba anteriores a la seguridad por cuenta).
--
-- Al aplicar migration_rls_owner_isolation.sql las filas que ya existían quedaron con owner_user_id nulo: ninguna cuenta las ve
-- desde el navegador, pero siguen ocupando la base. ESTE SCRIPT BORRA ESAS FILAS. No se corre solo: lo corrés vos en el SQL Editor
-- cuando quieras (conviene mirar primero los conteos del PASO 1).
--
-- PASO 1 (solo lectura): cuántas filas huérfanas hay por tabla
-- select table_name from information_schema.columns where table_schema = 'public' and column_name = 'owner_user_id';
-- (y para cada tabla: select count(*) from public.<tabla> where owner_user_id is null;)
--
-- PASO 2: borrado. Se borran primero los clubes sin dueño y sus tablas dependientes caen por las claves foráneas con CASCADE;
-- el resto se limpia tabla por tabla. Queda todo en una transacción: si algo falla, no se borra nada.

begin;

do $$
declare
  t text;
  n bigint;
  total bigint := 0;
begin
  for t in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name and tb.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.column_name = 'owner_user_id'
    order by c.table_name
  loop
    execute format('delete from public.%I where owner_user_id is null', t);
    get diagnostics n = row_count;
    if n > 0 then raise notice 'Se borraron % filas sin dueño de %', n, t; end if;
    total := total + n;
  end loop;
  raise notice 'Total de filas sin dueño borradas: %', total;
end $$;

commit;
