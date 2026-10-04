# Reporte de Ejecución: f2-db-missing-tables

- **Tarea**: Migración aditiva de 63 tablas faltantes en la BD viva (hallazgo G-01 de `f2-audit-gaps-perf`)
- **Rama**: `fix/f2-db-missing-tables`
- **Estado**: `DONE`
- **Quality Gates**: `build` no ejecutable en este entorno (SWC rechaza el directorio de caché por ACL de Windows); la tarea no toca `src/`. Verificación por evidencia de BD (ver abajo).

## Implementación
- `scripts/db/build_missing_tables_migration.cjs`: genera la migración aditiva desde `supabase.sql` (solo las tablas ausentes; sin `DROP`; políticas con `DROP POLICY IF EXISTS`; índices `IF NOT EXISTS`; seed `ON CONFLICT DO NOTHING`).
- `scripts/db/migration_missing_tables.sql`: artefacto generado (299 sentencias, 63 tablas).
- Aplicada en Supabase en 3 migraciones: `missing_tables_part1_core`, `part2_club_life`, `part3_season_career`.
- Bug de esquema corregido en `supabase.sql` y migración: la columna `career_calendar.current_date` es palabra reservada de SQL y falla el `CREATE TABLE`; ahora va entre comillas (`"current_date"`), que es el nombre que usa `src/api/calendar.js`.
- Otras migraciones aplicadas: `perf_rls_initplan_and_search_path` (RLS `(select auth.uid())` en `managers` y `search_path` fijo en `update_updated_at_column`), `index_all_unindexed_fks` (52 índices de cobertura de FKs sobre las tablas nuevas).
- `VACUUM FULL ANALYZE players`: 6 MB → 112 kB.

## Verificación
- `pg_tables` público: 31 → **94** tablas; `league_tiers_config` sembrada con 5 niveles.
- Desde el navegador (sesión de prueba) las 13 tablas muestreadas responden HTTP 200 (antes 404 PGRST205).
- Advisor de performance: `auth_rls_initplan` resuelto; `unindexed_foreign_keys` tratado con `index_all_unindexed_fks`.
- Pendiente fuera de alcance: RLS abierto (`USING (true)`) en las tablas nuevas, igual que las existentes; requiere mover reglas a RPC (Fase 3).
