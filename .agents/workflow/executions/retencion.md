# 2.0 Fase 5 · Retención

- BD (aditiva): `daily_scores.bonus`, `daily_starts` (RLS sin políticas), `daily_streak` (interna), `daily_get` y `daily_submit` con las mismas firmas (agregan racha, `seconds_since_start`, bonus por rapidez medido en el servidor: +10 ≤30 s, +5 ≤60 s) y nueve dilemas nuevos. `scripts/db/migration_daily_retention.sql`. Aplicada en producción por partes.
- Cliente: racha en el objetivo, cuenta regresiva del contrarreloj mientras se juega, línea de bonus en el resultado, pestaña Hoy/Ayer en la tabla (`dailyApi.board(friends, day)`; hoy se pide con un solo argumento), `domain/dailyTimer.js`.
- Pendiente de verificar: la prueba con rollback en producción (racha de 3 días, hueco, bonus) quedó pendiente de aprobación de la herramienta de base de datos; la migración es la que se aplicó.
- No incluido: push de recordatorio de racha (se puede sumar a `push-dispatch` después).
