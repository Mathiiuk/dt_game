-- Fix de rendimiento y seguridad (f2-audit-gaps-perf)
-- 1) RLS: evaluar auth.uid() una sola vez por consulta (initplan) en lugar de por fila.
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio manager" ON public.managers;
CREATE POLICY "Los usuarios pueden ver su propio manager" ON public.managers
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio manager" ON public.managers;
CREATE POLICY "Los usuarios pueden insertar su propio manager" ON public.managers
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio manager" ON public.managers;
CREATE POLICY "Los usuarios pueden actualizar su propio manager" ON public.managers
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- 2) Seguridad: fijar search_path de la funcion de trigger updated_at.
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
