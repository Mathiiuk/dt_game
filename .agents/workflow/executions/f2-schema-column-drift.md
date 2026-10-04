# Reporte de Ejecución: f2-schema-column-drift

- **Rama**: `fix/f2-schema-column-drift` | **Estado**: `DONE`
- **Origen**: al crearse las 63 tablas, el recorrido del navegador dejó de dar 404 y destapó 9 errores 400/409 por deriva entre el código y el esquema vivo.

## BD (aplicado en Supabase; SQL versionado en `scripts/db/migration_schema_drift_*.sql`)
- `sync_missing_columns_existing_tables`: todas las `ADD COLUMN IF NOT EXISTS` de `supabase.sql` y `scripts/db/*` que faltaban (ej. `clubs.primary_color`, `managers.personal_savings`, `employment_status`, `staff.wage_weekly`, columnas de `tactics`, `fixtures`, `competitions`, `scout_reports`...).
- `schema_compat_fixtures_players_season_history`: `fixtures.home_club_id/away_club_id/round` sincronizadas con `home_team_id/away_team_id/match_week` por trigger (el código usa ambos nombres); `players.name` y `players.overall` como columnas generadas; `season_history.manager_id` con FK e índice.

## Código
- `src/api/hallOfFame.js`: `managers` no tiene `club_id`; el club se obtiene por `clubs.manager_id` (antes: 400 "no relationship").
- `src/api/personalities.js` y `src/api/training.js`: `insert` → `upsert` idempotente (`ignoreDuplicates`) para eliminar los 409 por cargas concurrentes (Regla 2.1 #8).

## Verificación
- Recorrido de 14 rutas en el navegador (dashboard, calendario, tácticas, tabla, mercado, plantel, club, finanzas, entrenamiento, DT, selección, copa, salón de la fama, logros, epílogo) con interceptor de `fetch`: **0 respuestas 4xx/5xx** (antes: 9 tipos de error, 400/409).
- `npm run build` no ejecutable en este entorno (SWC rechaza el directorio de caché por ACL de Windows); Vite del navegador compiló los archivos modificados sin errores.
- No se ejecutaron acciones que mutan la carrera (avanzar semana, jugar partido) para no alterar la cuenta de prueba.
