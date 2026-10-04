# Reporte de Ejecución: f3-b5-schema-drift-round2
- **Rama**: `fix/f3-b5-schema-drift-round2` (basada en la integración de B1–B4 + aliases) | **Estado**: `DONE`
- **Origen**: prueba E2E en el navegador con la carrera de prueba (5 semanas de pretemporada + primer partido) sobre las correcciones de Fase 0. Errores hallados:

| Error | Causa | Solución |
|---|---|---|
| `clubs.tier` 400 (5 en el ciclo) | código pedía `tier`; la columna es `league_tier` | `contracts.js` |
| `players.attr_defending` 400 (**80 fallos en 5 semanas**: el entrenamiento nunca se aplicaba) | el código usa `attr_defending`/`attr_overall`; el esquema tiene atributos granulares | columnas escribibles + trigger que las deriva de los granulares; backfill (56 jugadores) |
| `dynamic_events.career_id` y otras 34 columnas del contrato ausentes en 11 tablas | tablas viejas sin las columnas del esquema vigente | migración `schema_drift_round2_columns` (+ índices FK) |
| `press_conferences.fixture_id` + columnas legadas NOT NULL (question, answer_chosen, tone) | modelo antiguo | columnas nuevas y `DROP NOT NULL` en las legadas |
| `match_events.player_id` uuid inválido `rival_1` | ids sintéticos de rivales | sólo se persisten uuid reales (`matchEngine.js`) |
| 409 `club_fanbase`, `club_stadiums`, `club_board_confidence` | inicialización concurrente con `insert` | `src/utils/ensureRow.js` (upsert idempotente) |

- **Verificación**: avance de semana (05→12/08) con **0 errores** de red y de consola (antes: 80+ fallos por semana); primer partido jugado y resumen post-partido cargado; `ensureRow` probado con llamadas concurrentes (sin 409).
- **Pendiente (rendimiento, Fase 1)**: avanzar una semana tarda ~16 s y el resumen post-partido ~25 s por cientos de `UPDATE` secuenciales (N+1). Se resolverá con RPC/lotes.
- **Pendiente menor**: `auditApi.logAction` recibe `whoId` vacío en el post-partido (sólo advertencia; se revisará con la Fase 1).
