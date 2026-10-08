-- Especialistas de pelota parada elegidos a mano: { PENALTY, FREE_KICK, CORNER, HEADER } con el id del jugador (null o ausente = el mejor por atributos).
alter table tactics add column if not exists set_piece_takers jsonb;
