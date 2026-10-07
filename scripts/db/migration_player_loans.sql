-- Cesiones a préstamo (línea "Mercado" del roadmap).
--
-- Ceder a un jugador a otro club de tu liga durante la temporada: no está disponible mientras tanto, dejás de pagarle el sueldo
-- (sale de tu plantel, que es de donde se calcula la masa salarial) y al cerrar la temporada vuelve. Máximo 3 cedidos a la vez y
-- hay que quedarse con al menos 16 jugadores. El club receptor es uno de los rivales de tu liga (de la IA).
alter table public.players add column if not exists loan_from_club_id uuid references public.clubs(id) on delete set null;
create index if not exists idx_players_loan_from on public.players (loan_from_club_id) where loan_from_club_id is not null;

create or replace function public.loan_out_player(p_club_id uuid, p_player_id uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare
  pl public.players%rowtype;
  comp uuid;
  borrower uuid;
  borrower_name text;
  squad_count integer;
  loans integer;
begin
  perform 1 from public.clubs where id = p_club_id and manager_id is not null;
  if not found then raise exception 'Club no encontrado.'; end if;
  select * into pl from public.players where id = p_player_id and club_id = p_club_id for update;
  if not found then raise exception 'Jugador no encontrado en tu plantel.'; end if;
  if pl.loan_from_club_id is not null then raise exception 'Ese jugador ya está a préstamo.'; end if;

  select count(*) into squad_count from public.players where club_id = p_club_id;
  if squad_count <= 16 then raise exception 'Necesitás al menos 16 jugadores en el plantel para ceder a alguien.'; end if;
  select count(*) into loans from public.players where loan_from_club_id = p_club_id;
  if loans >= 3 then raise exception 'Ya tenés 3 jugadores cedidos: es el máximo.'; end if;

  select competition_id into comp from public.standings where club_id = p_club_id limit 1;
  select s.club_id, c.name into borrower, borrower_name
  from public.standings s join public.clubs c on c.id = s.club_id
  where s.competition_id = comp and s.club_id <> p_club_id and c.manager_id is null
  order by random() limit 1;
  if borrower is null then raise exception 'No hay un club que pueda recibirlo.'; end if;

  update public.players
  set club_id = borrower, loan_from_club_id = p_club_id, is_transfer_listed = false, asking_price = null
  where id = p_player_id;

  return jsonb_build_object('borrower_id', borrower, 'borrower_name', borrower_name, 'wage_saved', coalesce(pl.contract_salary, 0));
end $$;

-- Al cerrar la temporada todos los cedidos vuelven a su club (antes de liberar a los de contrato vencido)
create or replace function public.return_loans(p_club_id uuid)
returns integer language plpgsql set search_path = public, pg_temp as $$
declare n integer;
begin
  perform 1 from public.clubs where id = p_club_id and manager_id is not null;
  if not found then raise exception 'Club no encontrado.'; end if;
  update public.players set club_id = p_club_id, loan_from_club_id = null where loan_from_club_id = p_club_id;
  get diagnostics n = row_count;
  return n;
end $$;
