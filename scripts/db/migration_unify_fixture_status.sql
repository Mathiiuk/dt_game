-- Aplicada en Supabase como: unify_fixture_status (tarea f3-b2-fixture-status-unification)
UPDATE public.fixtures SET status = 'SCHEDULED' WHERE status = 'PENDING';
UPDATE public.fixtures SET status = 'PLAYED' WHERE status = 'FINISHED';
ALTER TABLE public.fixtures ALTER COLUMN status SET DEFAULT 'SCHEDULED';
