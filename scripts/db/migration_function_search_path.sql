-- Fija el search_path de todas las funciones del esquema public que no lo tienen (aviso "Function Search Path Mutable" del asesor
-- de seguridad de Supabase). Son funciones SECURITY INVOKER que respetan la seguridad por fila, así que el riesgo era bajo, pero un
-- search_path fijo evita que un esquema ajeno pueda tapar una tabla o función. No cambia el comportamiento.
-- Las funciones nuevas deben declarar `set search_path = public` en su definición.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
  loop
    execute format('alter function %s set search_path = public, pg_temp', f.sig);
  end loop;
end $$;
