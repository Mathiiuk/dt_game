-- Plantillas basadas en planteles reales (Wikipedia es, CC BY-SA 4.0) con los NOMBRES CAMBIADOS: solo nombre, club y posición.
-- Los datos se cargan desde scripts/db/data_real_squads.sql. Un club sin plantel cargado usa los nombres derivados de antes.
create table if not exists public.real_squads (
  club_name text not null,
  slot integer not null check (slot between 0 and 11),
  player_name text not null,
  position text not null,
  source_page text,
  primary key (club_name, slot)
);
alter table public.real_squads enable row level security;
drop policy if exists "real_squads_select" on public.real_squads;
create policy "real_squads_select" on public.real_squads for select to authenticated using (true);

create or replace function public.league_scorer_name(p_club_id uuid, p_slot integer)
returns text language sql stable as $$
  select coalesce(
    (select rs.player_name from public.real_squads rs join public.clubs c on c.name = rs.club_name
      where c.id = p_club_id and rs.slot = p_slot limit 1),
    (array['Lucas','Mateo','Thiago','Bruno','Facundo','Nicolás','Franco','Joaquín','Agustín','Gonzalo','Emiliano','Santiago','Ezequiel','Matías','Leandro','Maximiliano','Cristian','Julián','Ramiro','Tomás'])[1 + (abs(hashtextextended(p_club_id::text || ':n:' || p_slot, 11)) % 20)::int]
      || ' ' ||
    (array['Gómez','Rodríguez','Fernández','López','Martínez','Pérez','Sosa','Romero','Álvarez','Torres','Ruiz','Díaz','Acosta','Benítez','Medina','Herrera','Suárez','Aguirre','Giménez','Ortiz','Castro','Molina','Silva','Rojas','Ibarra'])[1 + (abs(hashtextextended(p_club_id::text || ':a:' || p_slot, 13)) % 25)::int]
  )
$$;
