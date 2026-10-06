-- Premios de la Copa Continental liquidados por el servidor.
-- El pago ocurre dentro de play_cup_fixture, en la misma transacción que guarda el resultado: como el partido no se puede
-- volver a jugar, el premio tampoco se puede cobrar dos veces ni inventar un monto desde el navegador.
-- Montos: premio por partido (ganado 2.500, resto 800) y, si gana la final, 25.000 más.

create or replace function public.play_cup_fixture(p_fixture_id uuid, p_user_club_id uuid)
returns jsonb language plpgsql as $$
declare
  f public.international_fixtures%rowtype;
  game_day text;
  r record;
  user_goals integer;
  rival_goals integer;
  bonus integer;
  champion_prize integer := 0;
begin
  select * into f from public.international_fixtures where id = p_fixture_id for update;
  if not found then raise exception 'Partido internacional no encontrado'; end if;
  if f.played then raise exception 'Este partido ya fue disputado.'; end if;
  if p_user_club_id is distinct from f.home_club_id and p_user_club_id is distinct from f.away_club_id then
    raise exception 'Este partido no es de tu club.';
  end if;

  select left(game_date::text, 10) into game_day from public.clubs where id = p_user_club_id and manager_id is not null;
  if game_day is null then raise exception 'Club no encontrado.'; end if;
  if left(f.match_date, 10) > game_day then
    raise exception 'Este partido se juega el %. Avanzá las semanas hasta esa fecha.', f.match_date;
  end if;

  select * into r from public.cup_resolve(p_fixture_id);

  perform set_config('app.server_result', '1', true);
  update public.international_fixtures set home_score = r.home_score, away_score = r.away_score, winner_club_id = r.winner, played = true where id = p_fixture_id;

  user_goals := case when p_user_club_id = f.home_club_id then r.home_score else r.away_score end;
  rival_goals := case when p_user_club_id = f.home_club_id then r.away_score else r.home_score end;
  bonus := case when user_goals > rival_goals then 2500 else 800 end;
  if f.stage = 'final' and r.winner = p_user_club_id then champion_prize := 25000; end if;

  update public.clubs set budget = coalesce(budget, 0) + bonus + champion_prize where id = p_user_club_id;

  return jsonb_build_object(
    'home_score', r.home_score, 'away_score', r.away_score, 'winner_club_id', r.winner, 'leg', f.leg, 'stage', f.stage,
    'match_bonus', bonus, 'champion_prize', champion_prize
  );
end $$;
