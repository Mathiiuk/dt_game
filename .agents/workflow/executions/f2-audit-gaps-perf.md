# Reporte de Ejecución: f2-audit-gaps-perf

- **Tarea**: Auditoría de gaps Fase 2.1, rendimiento DB y recorrido UX
- **Rama**: `fix/f2-audit-gaps-perf`
- **Estado**: `DONE` (remediación aplicada; quedan 3 acciones manuales/de arquitectura, ver sección 5)
- **Fecha**: 2026-10-04
- **Alcance**: proyecto Supabase `dt_database`, app local en `localhost:5173` (cuenta de prueba), contratos `docs/Del_Potrero_al_Idolo_Fase_2_1`.

## 1. Hallazgos críticos

### G-01 [CRÍTICO] La base viva está desincronizada con `supabase.sql`
- La BD tiene **31 tablas**; el código referencia **94** y `supabase.sql` define 103.
- Faltan **63 tablas** que el código consulta (todas están definidas en `supabase.sql`): `careers`, `user_sessions`, `security_audit_log`, `contracts`, `match_events`, `match_reports`, `player_injuries`, `manager_xp_ledger`, `financial_transactions_ledger`, `club_fanbase`, `club_stadiums`, `club_board_confidence`, `club_training_plans`, `career_calendar`, `time_advance_log`, `season_snapshots`, `playoff_fixtures`, `league_tiers_config`, entre otras.
- Verificado desde el navegador: `GET /rest/v1/match_events` y `/careers` devuelven **404 PGRST205** ("Could not find the table in the schema cache").
- `list_migrations` devuelve vacío: no hay migraciones versionadas; el esquema se aplicó con scripts sueltos.
- Impacto: el código traga los errores y la UI "funciona" con datos vacíos. XP/ledger, contratos, lesiones, finanzas por ledger, aislamiento de carreras (Reglas 2.1 #4, #7, #10, #14) no se persisten.
- **No se puede aplicar `supabase.sql` completo**: contiene `DROP TABLE ... CASCADE` sobre `clubs`, `players`, `managers`, etc. Se requiere una migración aditiva que solo cree las 63 tablas, sus índices y políticas.

### G-02 [CRÍTICO] RLS abierto a `anon`
- 27 de 31 tablas tienen políticas `USING (true)` para INSERT/UPDATE/DELETE (incl. `players`, `clubs`, `fixtures`, `standings`, `hall_of_fame`, `audit_log`). Solo `managers` está acotada por `auth.uid()`.
- Contradice Reglas Maestras 2.1 #1, #2 y #12: el cliente es la autoridad (XP, dinero, resultados se escriben desde el frontend). Cualquiera con la anon key puede modificar o borrar datos de cualquier club.
- Remediación real = mover reglas a RPC `SECURITY DEFINER`/Edge Functions (Fase 3). No se cierra RLS a ciegas porque rompería la app.

### G-03 [ALTO] Credencial de BD hardcodeada en scripts versionados
- Más de 30 archivos en `scripts/db/*.cjs` contienen la cadena de conexión `postgres:<password>@db.<ref>.supabase.co`. Hay que **rotar la contraseña** de la base y leerla de `process.env.DATABASE_URL` (`.env.local` ya está ignorado por git).

### G-04 [MEDIO] Advisors de Supabase
- `auth_rls_initplan` en `managers` (3 políticas) → corregido en `scripts/db/perf_rls_initplan_fix.sql` (**sin aplicar**).
- `function_search_path_mutable` en `update_updated_at_column` → mismo script.
- `auth_leaked_password_protection` deshabilitado → activar en el dashboard de Auth (no es SQL).
- 32 índices "sin uso": con 36 jugadores y 380 fixtures es ruido; no eliminar hasta tener volumen real.

### G-05 [MEDIO] Bloat en `players`
- 36 filas vivas ocupan 4.4 MB de heap + 1.6 MB de índices (tras un `DELETE` de ~17 100 filas). Recomendado `VACUUM FULL players;` (lock breve, tabla pequeña).

## 2. Gaps vs contratos 2.1 (mapa)
| Contrato | Estado |
|---|---|
| Fase 10 (`match_events`, `match_interventions`, seed, `live-state` servidor) | Sin tablas; partido y persistencia de refresh viven en `sessionStorage` del cliente |
| Fase 5 (`manager_xp_ledger`) | Tabla ausente → XP sin ledger auditable |
| Fase 15 (`contracts`, `contract_negotiations`) | Ausentes |
| Fase 20 (`financial_transactions_ledger`) | Ausente |
| Fase 27 (`player_injuries`) | Ausente |
| Fase 7 (`career_calendar`, `time_advance_log`) | Ausentes; "tiempo del juego pertenece al servidor" (#9) incumplido |
| Fase 1 (`careers`, `user_sessions`, `security_audit_log`) | Ausentes; aislamiento por carrera (#10) no operativo |
| Reglas #8 idempotencia / #13 concurrencia | No hay claves de idempotencia ni RPC transaccionales |

## 3. Rendimiento en navegador (dev, StrictMode activo → los `x2` son artefacto de desarrollo)
| Ruta | Requests | Más lento | Observación |
|---|---|---|---|
| `/dashboard` (login) | 17 | 757 ms | `careers`/`managers`/`clubs` x3 |
| `/calendar` | 2 | 348 ms | ok |
| `/standings` | 2 | 185 ms | ok |
| `/market` | 4 | 332 ms | ok |
| `/squad` | 3 | 345 ms | ok |
| `/training` | 8 | 347 ms | `club_training_plans` x4 (404, tabla ausente) |
| `/manager` | **20** | 621 ms | `clubs` x6, `manager_job_offers` x4, `manager_career_stints` x4 (duplicados reales además de StrictMode) |
| `/national-team` | 8 | 574 ms | `managers` x4, `national_teams` x4 |
| `/international-cup` | 6 | 643 ms | ok |
| `/hall-of-fame` | 4 | 369 ms | ok |

Mejora propuesta: pasar `/manager` y `/national-team` por `queryCache.fetch` (ya existe en `src/utils/cache.js`) y reutilizar `manager`/`club` del `GameContext` en lugar de re-consultarlos. Latencia base ~230–250 ms por request (región us-east-1), por lo que reducir el número de round-trips es la palanca principal.

## 4. Pendiente de decisión del usuario
1. Aplicar `scripts/db/perf_rls_initplan_fix.sql` (el sistema denegó ejecutarlo automáticamente).
2. Autorizar la migración aditiva de las 63 tablas faltantes.
3. Rotar la contraseña de la base y migrar los scripts a `DATABASE_URL`.
4. `VACUUM FULL players;`

## 5. Resolución (actualizado)
| Hallazgo | Estado | Tarea / rama |
|---|---|---|
| G-01 63 tablas faltantes | Resuelto (31 -> 94 tablas) | `f2-db-missing-tables` |
| G-01b Deriva de columnas código/esquema (9 errores 400/409 destapados) | Resuelto, 0 errores 4xx en 14 rutas | `f2-schema-column-drift` |
| G-03 Credencial en scripts | Resuelto en código; **rotar contraseña (manual)** | `f2-scripts-env-credentials` |
| G-04 RLS initplan + search_path | Resuelto | `f2-db-missing-tables` |
| G-04 Leaked password protection | **Pendiente manual**: Dashboard Supabase > Auth > Passwords | - |
| G-05 Bloat `players` | Resuelto (6 MB -> 112 kB) | `f2-db-missing-tables` |
| Rendimiento `/manager`, `/national-team` | Resuelto (20 -> 11 requests en carga fría) | `f2-frontend-request-dedup` |
| G-02 RLS abierto a `anon` | **Pendiente (arquitectura)**: requiere RPC `SECURITY DEFINER`/Edge Functions (Fase 3) | - |
