-- Índices de las FK de usuario del reto diario (el linter de Supabase las marcaba sin índice: unindexed_foreign_keys).
-- Sirven al borrar una cuenta (la FK se revisa en cascada) y a las lecturas por usuario.
create index if not exists idx_daily_scores_user_id on public.daily_scores (user_id);
create index if not exists idx_daily_starts_user_id on public.daily_starts (user_id);
