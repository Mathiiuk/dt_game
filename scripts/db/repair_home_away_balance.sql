-- Reparación única (aplicada en producción el 2026-10-11): los clubes creados el 6/10, antes del calendario balanceado, tenían
-- 1 partido de local y 18 de visitante en la liga. Sin taquilla de local el club pierde plata cada semana (ingresos fijos ~1.150
-- contra gastos ~2.950) y terminaba en negativo. Se da vuelta la localía de los partidos PROGRAMADOS (uno de cada dos) de esos clubes.
-- Los partidos ya jugados no se tocan. No hace falta volver a correrla: el calendario nuevo ya sale balanceado (9 o 10 de local por rueda).
do $$
declare c record; f record; i integer;
begin
  perform set_config('app.server_result', '1', true);
  for c in
    select cl.id from public.clubs cl
    where cl.history_type is distinct from 'bot' and cl.manager_id is not null
      and (select count(*) from public.fixtures x where x.away_club_id = cl.id and x.status = 'SCHEDULED') >= 15
      and (select count(*) from public.fixtures x where x.home_club_id = cl.id and x.status = 'SCHEDULED') <= 2
  loop
    i := 0;
    for f in select * from public.fixtures x where (x.home_club_id = c.id or x.away_club_id = c.id) and x.status = 'SCHEDULED' order by x.match_date, x.id loop
      if i % 2 = 0 and f.away_club_id = c.id then
        update public.fixtures set home_team_id = f.away_team_id, away_team_id = f.home_team_id, home_club_id = f.away_club_id, away_club_id = f.home_club_id where id = f.id;
      end if;
      i := i + 1;
    end loop;
  end loop;
end $$;
