-- Bitácora de consecuencias: alimenta el feed "Esto pasó por tu decisión".
create table if not exists consequence_log (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  season_year integer not null default 2026,
  week_number integer not null default 1,
  source text not null,
  message text not null,
  fans integer not null default 0,
  board integer not null default 0,
  locker integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_consequence_log_club_created on consequence_log (club_id, created_at desc);

alter table consequence_log enable row level security;
drop policy if exists consequence_log_all on consequence_log;
create policy consequence_log_all on consequence_log for all using (true) with check (true);
