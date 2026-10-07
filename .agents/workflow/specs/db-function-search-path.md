# Specification — db-function-search-path

## 1. Objetivo
Cerrar el aviso "Function Search Path Mutable" del asesor de seguridad de Supabase.

## 2. Problema
33 funciones SQL del esquema public no tenían `search_path` fijo. Son SECURITY INVOKER (respetan la seguridad por fila), por lo que el riesgo era bajo, pero un `search_path` mutable permite que un esquema ajeno tape una tabla o función.

## 3. Resultado esperado
Todas las funciones de public declaran `search_path = public, pg_temp`. Sin cambio de comportamiento. Las nuevas deben declararlo.

## 4. Alcance
Migración `migration_function_search_path.sql` (aplicada; verificada con `close_week_finances` y `settle_season_prize` en la base). No incluido: "contraseñas filtradas" (ajuste del panel) ni la tabla `game_data_migrations` (RLS sin políticas: nadie la lee, es lo deseado).

## 5. Criterios de aceptación
- [x] AC-01: el asesor ya no marca funciones con search_path mutable.
- [x] AC-02: las funciones del juego siguen funcionando.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/db-function-search-path.yml`
