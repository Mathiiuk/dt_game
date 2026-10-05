-- Normaliza la caja de las carreras existentes a la nueva economía (única vez, idempotente).
-- Aprobado: la dirigencia "reestructura las finanzas". Clubes con caja <= 25.000 (déficit incluido) no se tocan.
do $$
begin
  if exists (select 1 from game_data_migrations where name = 'economy_cash_normalization_v1') then
    return;
  end if;

  insert into financial_transactions_ledger (club_id, season_year, week_number, category, amount, balance_after, description)
  select c.id,
         (extract(year from gd)::int - case when extract(month from gd) < 7 then 1 else 0 end),
         least(52, greatest(1, floor((gd - make_date(extract(year from gd)::int - case when extract(month from gd) < 7 then 1 else 0 end, 7, 1)) / 7.0)::int + 1)),
         'RESTRUCTURING',
         20000 - c.budget,
         20000,
         'La dirigencia reestructuró las finanzas del club: se pagaron deudas atrasadas y se ajustó el presupuesto'
  from clubs c, lateral (select coalesce(nullif(c.game_date::text, '')::date, current_date) as gd) g
  where c.budget > 25000;

  update clubs set budget = 20000 where budget > 25000;

  insert into game_data_migrations (name) values ('economy_cash_normalization_v1');
end $$;
