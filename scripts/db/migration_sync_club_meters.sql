-- Hinchada y dirigencia: una sola verdad con dos espejos sincronizados (igual que la moral de los jugadores).
--   clubs.fans_confidence  <-> club_fanbase.fan_support_score
--   clubs.board_confidence <-> club_board_confidence.confidence_score
-- Manda la tabla de detalle cuando existe; los triggers evitan recursión comparando valores.

create or replace function sync_fans_from_club() returns trigger language plpgsql as $$
begin
  if new.fans_confidence is distinct from old.fans_confidence then
    update club_fanbase set fan_support_score = new.fans_confidence
      where club_id = new.id and fan_support_score is distinct from new.fans_confidence;
  end if;
  return new;
end $$;

create or replace function sync_fans_from_fanbase() returns trigger language plpgsql as $$
begin
  update clubs set fans_confidence = new.fan_support_score
    where id = new.club_id and fans_confidence is distinct from new.fan_support_score;
  return new;
end $$;

create or replace function sync_board_from_club() returns trigger language plpgsql as $$
begin
  if new.board_confidence is distinct from old.board_confidence then
    update club_board_confidence set confidence_score = new.board_confidence
      where club_id = new.id and confidence_score is distinct from new.board_confidence;
  end if;
  return new;
end $$;

create or replace function sync_board_from_detail() returns trigger language plpgsql as $$
begin
  update clubs set board_confidence = new.confidence_score
    where id = new.club_id and board_confidence is distinct from new.confidence_score;
  return new;
end $$;

drop trigger if exists trg_sync_fans_from_club on clubs;
create trigger trg_sync_fans_from_club after update of fans_confidence on clubs
  for each row execute function sync_fans_from_club();
drop trigger if exists trg_sync_fans_from_fanbase on club_fanbase;
create trigger trg_sync_fans_from_fanbase after insert or update of fan_support_score on club_fanbase
  for each row execute function sync_fans_from_fanbase();
drop trigger if exists trg_sync_board_from_club on clubs;
create trigger trg_sync_board_from_club after update of board_confidence on clubs
  for each row execute function sync_board_from_club();
drop trigger if exists trg_sync_board_from_detail on club_board_confidence;
create trigger trg_sync_board_from_detail after insert or update of confidence_score on club_board_confidence
  for each row execute function sync_board_from_detail();

-- Reconciliación inicial: la tabla de detalle manda
update clubs c set fans_confidence = f.fan_support_score
  from club_fanbase f where f.club_id = c.id and c.fans_confidence is distinct from f.fan_support_score;
update clubs c set board_confidence = b.confidence_score
  from club_board_confidence b where b.club_id = c.id and c.board_confidence is distinct from b.confidence_score;
