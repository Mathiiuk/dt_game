-- Los registros de traspaso (transfer_audit_log) guardan la TEMPORADA (la que arranca el 1 de julio), no el año calendario:
-- un fichaje de enero y uno de septiembre del mismo año calendario son de temporadas distintas y el resumen del año los mezclaba.
-- Corrige negotiate_transfer y resolve_sale_offer sobre su definición actual. Los registros anteriores conservan el año calendario.
do $$
declare f record; def text; n int := 0;
begin
  for f in
    select p.oid, p.proname
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.proname in ('negotiate_transfer', 'resolve_sale_offer')
  loop
    def := pg_get_functiondef(f.oid);
    if position('extract(year from game_d)::integer, now()' in def) > 0 then
      def := replace(def, 'extract(year from game_d)::integer, now()', '(extract(year from game_d)::integer - case when extract(month from game_d) < 7 then 1 else 0 end), now()');
      execute def;
      n := n + 1;
    end if;
  end loop;
  if n <> 2 then raise exception 'Se esperaba corregir 2 funciones y se corrigieron %', n; end if;
end $$;
