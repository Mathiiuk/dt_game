-- Camino a la leyenda (aditivo): los puntos de legado del DT de quien está conectado, junto a los de las leyendas de la tabla pública.
-- Es solo lectura y solo de uno mismo (no depende del consentimiento: no se publica nada). Misma fórmula que la tabla pública:
-- títulos de liga x 400 + continentales x 800 + victorias x 15 + efectividad (%) x 20 + reputación x 10; las leyendas valen 600 puntos por título.
create or replace function public.legend_road()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  mine jsonb;
begin
  if uid is null then raise exception 'Necesitás iniciar sesión.'; end if;
  select jsonb_build_object('points', x.pts, 'titles', x.nat + x.intl, 'played', x.played, 'won', x.won) into mine
  from (
    select b.*, greatest(0, round(b.nat * 400 + b.intl * 800 + b.won * 15 + (case when b.played > 0 then round(b.won::numeric / b.played * 100, 1) else 0 end) * 20 + b.rep * 10))::integer as pts
    from (
      select coalesce(m.reputation, 0) as rep,
        (select count(*) from public.match_history h where h.club_id = c.id) as played,
        (select count(*) from public.match_history h where h.club_id = c.id
           and ((h.is_home and h.home_score > h.away_score) or (not h.is_home and h.away_score > h.home_score))) as won,
        (select count(*) from public.manager_achievements a where a.manager_id = m.id and a.achievement_type = 'league_champion') as nat,
        (select count(*) from public.manager_achievements a where a.manager_id = m.id and a.achievement_type = 'continental_champion') as intl
      from public.managers m
      join public.clubs c on c.manager_id = m.id
      where m.user_id = uid and coalesce(m.is_retired, false) = false
      order by m.created_at desc
      limit 1
    ) b
  ) x;
  return jsonb_build_object(
    'me', mine,
    'legends', coalesce((select jsonb_agg(jsonb_build_object('name', l.manager_name, 'era', l.era, 'titles', l.titles, 'points', l.titles * 600) order by l.titles desc, l.manager_name) from public.legend_managers l), '[]'::jsonb)
  );
end
$$;

revoke all on function public.legend_road() from public, anon;
grant execute on function public.legend_road() to authenticated;
