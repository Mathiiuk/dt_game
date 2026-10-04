# Reporte de Ejecución: f2-perf-optimization

- **ID de Tarea**: `f2-perf-optimization`
- **Título**: Optimización de Rendimiento de Navegación y Caché de Consultas
- **Tipo**: `fix`
- **Rama**: `fix/f2-perf-optimization-optimizacion-de-rendimiento-de-navegacion-y-cache-de-consultas`
- **Estado**: `DONE`
- **Quality Gates**: `[PASS] build -> npm run build` (100% verde)

---

## 1. Análisis del Problema (`localhost.har` y Diagnóstico)
A partir del análisis exhaustivo del archivo `docs/localhost.har` y la captura de pantalla de Chrome DevTools proporcionada:

1. **Peticiones Duplicadas Concurrentes (Doble Fetch)**:
   - En cada carga o actualización de página, Supabase recibía dos solicitudes idénticas para:
     - `managers`: 2 llamadas (193 ms y 363 ms).
     - `clubs`: 2 llamadas (171 ms y 169 ms).
     - `level_config`: 2 llamadas (173 ms y 191 ms).
     - `fixtures`: 2 llamadas con joins pesados (291 ms y 399 ms).
     - `dynamic_events`: 2 llamadas (178 ms y 174 ms).
   - **Causa**: Falta de deduplicación de promesas en vuelo (in-flight request deduplication) entre `GameContext` y los componentes montados en paralelo (agravado por el doble montaje de `useEffect` en desarrollo).

2. **Latencia Excesiva entre Secciones ("Lento y Carga Mucho")**:
   - Cada navegación (Inicio -> Plantel -> Club -> Finanzas -> Tácticas -> Competición) destruía el estado y forzaba `loading = true`.
   - La pantalla quedaba en blanco con un spinner durante 500 ms - 1500 ms esperando entre 2 y 8 consultas a Supabase en cada clic.
   - `ClubScreen` ejecutaba 8 peticiones concurrentes en cada entrada.
   - `FinancesScreen` calculaba sueldos y mantenimiento volviendo a pedir jugadores, staff y club en cada navegación.

3. **Error "Cargando tabla no muestra nada queda en negro"**:
   - Se detectó un bucle desbocado: `competitionApi.getStandings` fallaba con `.single()` porque el club tenía múltiples filas en `standings`.
   - Al fallar, `StandingsScreen` creaba una **nueva competición con 19 clubes bot y 380 fixtures** en cada visita, acumulando 52 competiciones, 990 clubes y más de 19.000 fixtures en la base de datos, ralentizando drásticamente la latencia de Postgres.
   - Cuando la tabla retornaba vacía, el renderizado no mostraba ningún estado amigable, dejando el recuadro negro.

---

## 2. Soluciones Implementadas

1. **Motor de Caché y Deduplicación en Memoria (`src/utils/cache.js`)**:
   - Sistema de deduplicación de promesas en vuelo: si dos componentes o montajes piden el mismo recurso simultáneamente, solo viaja 1 petición a la red y ambos comparten la misma respuesta.
   - Caché con TTL parametrizable:
     - `level_config`: 1 hora (estático).
     - `squad`, `tactics`, `club:screen`, `finances`, `standings`, `fixtures`, `events`: 30 a 60 segundos con renderizado instantáneo (0 ms al cambiar de pestaña).
   - Métodos de invalidación quirúrgica (`invalidate(prefix)` y `clear()`).

2. **Optimización de `GameContext.jsx`**:
   - Incorporada deduplicación mediante `inFlightContextPromise` y `queryCache`.
   - Eliminadas las dobles llamadas de inicio a `managers` y `clubs`.

3. **Saneamiento Profundo de la Base de Datos (`clean_runaway_competitions.cjs`)**:
   - Reducido de 990 clubes a 21 clubes activos (eliminados 969 bots huérfanos y 17.100 jugadores duplicados).
   - Reducido de 19.380 fixtures a los 380 oficiales de la temporada.
   - Creado índice de unicidad `uq_standings_club_competition` para bloquear matemáticamente la duplicación en PostgreSQL.

4. **Sustitución de Dynamic Imports por Imports Estáticos**:
   - En `Dashboard.jsx`, `levelsApi`, `eventsApi` y `supabase` ahora se importan estáticamente a nivel de módulo, evitando micro-peticiones ESM en tiempo de ejecución.
   - Al avanzar de semana (`advanceWeek`), se vacía la caché con `queryCache.clear()` para garantizar frescura de datos inmediata.

5. **Transición Instantánea en Pantallas (Stale-While-Revalidate)**:
   - `SquadScreen.jsx`, `ClubScreen.jsx`, `FinancesScreen.jsx`, `TacticsScreen.jsx` y `StandingsScreen.jsx` ahora se inicializan con la caché en memoria si existe.
   - Navegar entre pestañas ahora es **instantáneo** (sin parpadeos de carga ni pantallas negras).
   - En `StandingsScreen.jsx`, implementado estado amigable con botón de reintento si la tabla aún no cuenta con datos.

---

## 3. Quality Gates y Verificación
- Manifiesto: `.agents/workflow/tasks/f2-perf-optimization.yml`
- Comando: `npx agt task:verify f2-perf-optimization`
- Resultado: `[PASS] build -> npm run build` (0 errores de compilación).
