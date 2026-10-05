-- Estado del clima de cada club: presión, barra, favores, escándalos y suspensión.
create table if not exists club_climate (
  club_id uuid primary key references clubs(id) on delete cascade,
  pressure integer not null default 0,
  climate text not null default 'FLOWS',
  barra_stage text not null default 'CALM',
  favors integer not null default 0,
  scandals integer not null default 0,
  suspended_matches integer not null default 0,
  board_owed integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint club_climate_barra_stage_check check (barra_stage in ('CALM', 'ASKS', 'PRESSURES', 'SQUEEZES', 'INVASION')),
  constraint club_climate_climate_check check (climate in ('FLOWS', 'TENSION', 'CRISIS', 'CHAOS'))
);

alter table club_climate enable row level security;
drop policy if exists club_climate_all on club_climate;
create policy club_climate_all on club_climate for all using (true) with check (true);

-- Las nuevas categorías de eventos no cambian: se reutilizan COMMUNITY, LOCKER_ROOM, BOARD_PRESS y FINANCIAL_CRISIS.
