-- Endurecimiento de la base (aplicado en producción el 2026-10-11, a partir de los avisos de seguridad de Supabase).
-- 1) friend_post escribe en el muro de cualquier sala con permisos del dueño: solo la usan las funciones de la liga de amigos,
--    así que ningún usuario (ni anónimo) puede llamarla directo.
revoke execute on function public.friend_post(uuid, text, text, uuid) from public, anon, authenticated;
-- 2) friend_is_member solo la necesitan las políticas de lectura (usuarios con sesión), no los anónimos.
revoke execute on function public.friend_is_member(uuid) from public, anon;
grant execute on function public.friend_is_member(uuid) to authenticated;
-- 3) Rutas de búsqueda fijas para que nadie pueda sombrear objetos de public.
alter function public.league_scorer_name(uuid, integer) set search_path = public;
alter function public.record_league_goals(uuid, uuid, uuid, text, integer) set search_path = public;
alter function public.apply_league_match(uuid, uuid, integer, integer, boolean, integer) set search_path = public;
alter function public.friend_mangos(integer, integer) set search_path = public;
alter function public.friend_league_points(jsonb, integer, integer, boolean, integer, integer) set search_path = public;
-- 4) Índice de la única clave foránea sin cubrir.
create index if not exists idx_buyback_rights_player on public.buyback_rights (player_id);
