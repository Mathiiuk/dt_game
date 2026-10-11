-- Suspensiones: tarjetas amarillas acumuladas por temporada y partidos de sanción pendientes.
-- Aditivo: `is_suspended` se mantiene (versiones viejas del cliente lo siguen leyendo) y `batch_update_players`
-- acepta las claves nuevas sin cambiar el comportamiento con las de siempre.

alter table public.players add column if not exists yellow_cards_season integer not null default 0;
alter table public.players add column if not exists suspended_matches integer not null default 0;
alter table public.players add column if not exists suspension_reason text;
alter table public.players drop constraint if exists players_suspension_reason_check;
alter table public.players add constraint players_suspension_reason_check check (suspension_reason is null or suspension_reason in ('RED', 'YELLOWS'));

create or replace function public.batch_update_players(rows jsonb)
returns integer language plpgsql set search_path to 'public', 'pg_temp' as $function$
declare n int;
begin
  update public.players p set
    state_fitness = case when e ? 'state_fitness' then (e->>'state_fitness')::int else p.state_fitness end,
    state_morale  = case when e ? 'state_morale'  then (e->>'state_morale')::int  else p.state_morale end,
    injury_days   = case when e ? 'injury_days'   then (e->>'injury_days')::int   else p.injury_days end,
    injury_type   = case when e ? 'injury_type'   then e->>'injury_type'          else p.injury_type end,
    is_injured    = case when e ? 'is_injured'    then (e->>'is_injured')::boolean else p.is_injured end,
    attr_pace     = case when e ? 'attr_pace'     then (e->>'attr_pace')::int     else p.attr_pace end,
    attr_passing  = case when e ? 'attr_passing'  then (e->>'attr_passing')::int  else p.attr_passing end,
    attr_defending= case when e ? 'attr_defending' then (e->>'attr_defending')::int else p.attr_defending end,
    attr_shooting = case when e ? 'attr_shooting' then (e->>'attr_shooting')::int else p.attr_shooting end,
    matches_played= case when e ? 'matches_played' then (e->>'matches_played')::int else p.matches_played end,
    goals_scored  = case when e ? 'goals_scored'  then (e->>'goals_scored')::int  else p.goals_scored end,
    club_status   = case when e ? 'club_status'   then e->>'club_status'          else p.club_status end,
    legend_reason = case when e ? 'legend_reason' then e->>'legend_reason'        else p.legend_reason end,
    is_idol       = case when e ? 'is_idol'       then (e->>'is_idol')::boolean   else p.is_idol end,
    yellow_cards_season = case when e ? 'yellow_cards_season' then (e->>'yellow_cards_season')::int else p.yellow_cards_season end,
    suspended_matches   = case when e ? 'suspended_matches'   then (e->>'suspended_matches')::int   else p.suspended_matches end,
    suspension_reason   = case when e ? 'suspension_reason'   then e->>'suspension_reason'          else p.suspension_reason end,
    is_suspended        = case when e ? 'is_suspended'        then (e->>'is_suspended')::boolean    else p.is_suspended end
  from jsonb_array_elements(rows) e
  where p.id = (e->>'id')::uuid;
  get diagnostics n = row_count;
  return n;
end $function$;
