# 🧠 Contexto y Memoria del Proyecto: dt_game

> **Última sincronización:** 2026-10-05T16:49:47.541Z | **Nodos:** 299 | **Tareas:** 101

## 📦 Mapa de Módulos y Dependencias

| Módulo | Líneas | Dependencias Principales |
|---|---|---|
| `src/api/career.js` | 757 | ./supabase, ./audit, ../utils/cache |
| `src/api/contracts.js` | 738 | ./supabase, ../utils/cache, ./audit |
| `src/features/match/PostMatchScreen.jsx` | 593 | react, react-router-dom, ../../api/postMatch |
| `src/api/achievements.js` | 566 | ./supabase, ./career, ./hallOfFame |
| `src/features/match/MatchScreen.jsx` | 556 | react, react-router-dom, ../../api/auth |
| `src/api/postMatch.js` | 497 | ./manager, ./supabase, ./gameConfig |
| `src/api/nationalTeam.js` | 496 | ./supabase, ./manager, ./audit |
| `src/api/calendar.js` | 495 | ./supabase, ../domain/fixtureStatus, ../domain/gameWeek |
| `src/features/club/screens/LockerRoomTab.jsx` | 460 | react, lucide-react, ../../../api/lockerRoom |
| `src/api/events.js` | 452 | ./supabase, ../utils/cache, ./audit |
| `src/features/squad/SquadScreen.jsx` | 437 | react, lucide-react, sonner |
| `src/features/manager/ManagerCareerScreen.jsx` | 436 | react, react-router-dom, lucide-react |
| `src/api/auth.js` | 428 | ./supabase, ../utils/cache, ./audit |
| `src/api/competition.js` | 427 | ./supabase, ../utils/cache, ../domain/fixtureStatus |
| `src/api/clubHistory.js` | 423 | ./supabase |
| `src/api/matchEngine.js` | 414 | ./supabase, ../domain/fixtureStatus |
| `src/api/press.js` | 411 | ./supabase, ../utils/cache |
| `src/features/dashboard/Dashboard.jsx` | 408 | react, react-router-dom, lucide-react |
| `src/api/injuries.js` | 399 | ./supabase, ../utils/cache |
| `src/api/lockerRoom.js` | 395 | ./supabase, ../utils/cache |
| `src/api/stadium.js` | 393 | ./supabase, ../utils/ensureRow, ../utils/cache |
| `src/features/club/screens/StadiumManagementTab.jsx` | 389 | react, lucide-react, ../../../api/stadium |
| `src/api/training.js` | 380 | ./supabase |
| `src/features/club/screens/IdolsLegendsTab.jsx` | 366 | react, lucide-react, ../../../api/legends |
| `src/api/academy.js` | 364 | ./supabase, ../utils/cache, ./levels |

_(+118 módulos adicionales; consultar con `memory:query`)_

## 📋 Tareas Registradas

- **ci-auto-merge-retry: Auto-merge resistente a pushes concurrentes** `[DONE]`
- **f2-1-block-a-fundamentals: Fase 2.1: Bloque A - Contratos de Dominio Fundamentos (Fases 01 a 10)** `[DONE]`
- **f2-1-block-b-management: Fase 2.1: Bloque B - Contratos de Dominio Gestion Deportiva y Economica (Fases 11 a 20)** `[DONE]`
- **f2-1-block-c-human-environment: Fase 2.1: Bloque C - Contratos de Dominio Entorno y Simulacion Humana (Fases 21 a 30)** `[DONE]`
- **f2-1-block-d-career-endgame: Fase 2.1: Bloque D - Contratos de Dominio Carrera, Gloria y Endgame (Fases 31 a 40)** `[DONE]`
- **f2-33-national-teams: Fase 33: Selecciones Nacionales y Doble Carrera** `[DONE]`
- **f2-34-international-cups: Fase 34: Competiciones Internacionales y Copas Continentales** `[DONE]`
- **f2-36-37-club-history-idols: Fases 36 y 37: Historia del Club, Récords e Ídolos** `[DONE]`
- **f2-38-hall-of-fame: Fase 38: Salon de la Fama y Records Historicos Globales** `[DONE]`
- **f2-39-achievements: Fase 39: Sistema de Logros y Desafios de Carrera** `[DONE]`
- **f2-40-endgame: Fase 40: Endgame, Epilogo de Carrera y Legado Dinastico** `[DONE]`
- **f2-audit-fixes-polish: Fixes y Mejoras de Auditoria Manual PWA y Mobile UX** `[DONE]`
- **f2-audit-gaps-perf: Auditoria de gaps Fase 2.1, rendimiento DB y recorrido UX** `[DONE]`
- **f2-db-audit-optimization: Optimizacion de Indices y Politicas RLS en Base de Datos** `[DONE]`
- **f2-db-deep-fixes: Correccion de FK erronea en managers e indexacion total de FKs** `[DONE]`
- **f2-db-missing-tables: Migracion aditiva de 63 tablas faltantes en la BD viva** `[DONE]`
- **f2-perf-optimization: Optimizacion de Rendimiento de Navegacion y Cache de Consultas** `[DONE]`
- **f2-schema-column-drift: Sincronizar columnas faltantes en tablas existentes de la BD viva** `[DONE]`
- **f2-scripts-env-credentials: Eliminar credencial de BD hardcodeada de scripts versionados** `[DONE]`
- **f3-b1-retirement-dynasty-guard: Guard de retiro: obligar a iniciar nueva dinastia y bloquear volver atras** `[DONE]`
- **f3-b2-fixture-status-unification: Unificar estados de fixture y habilitar el boton de jugar partido** `[DONE]`
- **f3-b3-contract-expiry-alert: Alerta de contratos por vencer calculada por fecha, no por anos restantes** `[DONE]`
- **f3-b4-weekly-events-call: Corregir llamada a eventsApi inexistente al avanzar semana** `[DONE]`
- **f3-b5-schema-drift-round2: Ronda 2 de deriva codigo-esquema: columnas faltantes, uuid de rivales, upserts de inicializacion** `[DONE]`
- **f3-p1-match-squad-rule: Jugar con plantel incompleto: juveniles y lesionados con penalizacion** `[DONE]`
- **f3-p1-postmatch-idempotency: Post-partido idempotente: reclamo por fixture, sin lesiones duplicadas** `[DONE]`
- **f3-p1-query-client: TanStack Query como motor de cache (adaptador sobre queryCache)** `[DONE]`
- **f3-p1-test-infra: Infraestructura de tests: Vitest, Testing Library y gate en CI** `[DONE]`
- **f3-p1-weekly-cascade: Ciclo semanal: simular fechas de IA y reemplazar N+1 por RPC en lote** `[DONE]`
- **f3-p2-achievements-hof-screens: Pantallas Logros y Salón de la Fama rediseñadas** `[DONE]`
- **f3-p2-app-shell: AppShell: sidebar en desktop, barra inferior y pagina Mas en movil** `[DONE]`
- **f3-p2-auth-wizards: Auth y asistentes de creación rediseñados** `[DONE]`
- **f3-p2-calendar-screen: Pantalla Calendario rediseñada** `[DONE]`
- **f3-p2-club-screen: Pantalla Club rediseñada y paneles internos sobre ResponsiveOverlay** `[DONE]`
- **f3-p2-creation-wizards: Asistentes de creacion de DT y club rediseñados** `[DONE]`
- **f3-p2-design-system: Sistema de diseno: tokens, tipografia y componentes base** `[DONE]`
- **f3-p2-finances-screen: Pantalla Finanzas rediseñada** `[DONE]`
- **f3-p2-manager-career-screen: Pantalla Carrera del DT rediseñada** `[DONE]`
- **f3-p2-market-screen: Pantalla Mercado rediseñada con oferta en ResponsiveOverlay** `[DONE]`
- **f3-p2-modals-squad: Modales del plantel a ResponsiveOverlay (contrato, mentoria, evolucion)** `[DONE]`
- **f3-p2-national-cup-screens: Pantallas Selección Nacional y Copa Internacional rediseñadas** `[DONE]`
- **f3-p2-remaining-legacy: Cierre de Fase 2: Endgame, Partido, Post-partido y retiro de BottomNav** `[DONE]`
- **f3-p2-responsive-overlay: ResponsiveOverlay: modal en escritorio, pagina completa en movil** `[DONE]`
- **f3-p2-squad-screen: Pantalla Plantel rediseñada con paneles a ResponsiveOverlay** `[DONE]`
- **f3-p2-standings-screen: Pantalla Tabla rediseñada** `[DONE]`
- **f3-p2-tactics-pitch: Pizarra tactica: cancha de 11 con animacion de formaciones** `[DONE]`
- **f3-p2-training-screen: Pantalla Entrenamiento rediseñada** `[DONE]`
- **f3-players-column-aliases: Corregir columnas inexistentes number y potential_rating en evolucion y retiros** `[DONE]`
- **feat-async-button-feedback: Botones con bloqueo y spinner automaticos en acciones asincronas** `[DONE]`
- **feat-fase-01-auth-session: Fase 01: Inicio de Sesión, Autenticación y Aislamiento de Carreras** `[DONE]`
- **feat-fase-02-dt-creation: Fase 02: Creación de DT, Presets de Trasfondo y Validación Suma Cero** `[DONE]`
- **feat-fase-03-club-foundation: Fase 03: Creación y Fundación del Club, Identidad Visual y Balance Tier 5** `[DONE]`
- **feat-fase-04-initial-squad: Fase 04: Generación Procedural del Primer Plantel, Cuotas Posicionales y Contratos** `[DONE]`
- **feat-fase-05-manager-levels: Fase 05: Niveles y Progresión del DT, Curva Polinómica y Ledger de XP** `[DONE]`
- **feat-fase-06-dashboard-overview: Fase 06: Dashboard Central y Modelo de Lectura Agregado SWR** `[DONE]`
- **feat-fase-07-calendar-engine: Fase 07: Calendario, Motor de Tiempo y Avance Semanal** `[DONE]`
- **feat-fase-08-training-regime: Fase 08: Entrenamiento, Preparacion Fisica y Desarrollo Individual** `[DONE]`
- **feat-fase-09-tactics-system: Fase 09: Tacticas, Formaciones, Pizarra y Afinidad Posicional** `[DONE]`
- **feat-fase-10-match-engine: Fase 10: Motor de Simulacion de Partidos, Direccion en Vivo y Anti-Save Scumming** `[DONE]`
- **feat-fase-11-post-match: Fase 11: Resumen Post-Partido, Calificaciones, Taquilla y Secciones Mobile** `[DONE]`
- **feat-fase-12-league-standings: Fase 12: Competicion de Liga, Tabla de Posiciones y Criterios de Desempate** `[DONE]`
- **feat-fase-13-transfer-market: Fase 13: Mercado de Pases, Transferencias y Agentes Libres** `[DONE]`
- **feat-fase-14-player-sales: Fase 14: Ventas de Jugadores, Lista de Transferibles y Ofertas de IA** `[DONE]`
- **feat-fase-15-contracts-renewals: Fase 15: Contratos, Renovaciones, Cláusulas y Masa Salarial** `[DONE]`
- **feat-fase-16-agents-reps: Fase 16: Agentes, Representantes y Relaciones con el DT** `[DONE]`
- **feat-fase-17-scouting-fow: Fase 17: Red de Ojeadores, Misiones y Niebla de Guerra** `[DONE]`
- **feat-fase-18-youth-academy: Fase 18: Cantera, Divisiones Inferiores y Camada Anual** `[DONE]`
- **feat-fase-19-staff-roles: Fase 19: Cuerpo Técnico, Staff y Especialistas** `[DONE]`
- **feat-fase-20-economy-finances: Fase 20: Economia Integral, Balance Semanal y Finanzas del Club** `[DONE]`
- **feat-fase-21-stadium-infrastructure: Fase 21: Estadio, Infraestructura y Mejoras Edilicias** `[DONE]`
- **feat-fase-22-fanbase-support: Fase 22: Hinchada, Aficion y Masa Social** `[DONE]`
- **feat-fase-23-board-confidence: Fase 23: Dirigencia, Confianza y Condicion de Despido** `[DONE]`
- **feat-fase-24-press-conferences: Fase 24: Prensa Deportiva, Ruedas de Prensa y Reputacion** `[DONE]`
- **feat-fase-25-locker-room: Fase 25: Vestuario, Cohesion y Jerarquia de Liderazgo** `[DONE]`
- **feat-fase-26-player-personalities: Fase 26: Personalidades, Rasgos y Psicologia del Jugador** `[DONE]`
- **feat-fase-27-injuries-medical-infirmary: Fase 27 - Lesiones, Recuperacion y Cuerpo Medico** `[DONE]`
- **feat-fase-28-player-evolution-aging-decline: Fase 28 - Evolucion de Jugadores, Picos de Rendimiento y Declive** `[DONE]`
- **feat-fase-29-season-close-annual-transition: Fase 29 - Temporadas, Ciclos Anuales y Balance Deportivo** `[DONE]`
- **feat-fase-30-promotion-relegation-pyramid: Fase 30 - Ascensos, Descensos y Estructura Piramidal de Ligas** `[DONE]`
- **feat-fase-31-manager-career-job-offers: Fase 31 - Carrera del DT, Ofertas de Trabajo y Renuncias** `[DONE]`
- **feat-fase-32-manager-reputation-prestige: Fase 32 - Reputacion Profesional y Prestigio del DT** `[DONE]`
- **feat-fase-33-national-teams-dual-career: Fase 33 - Selecciones Nacionales y Doble Carrera** `[DONE]`
- **feat-fase-34-international-cups: Fase 34 - Competiciones Internacionales y Copas Continentales** `[DONE]`
- **feat-fase-35-dynamic-events-dilemmas: Fase 35 - Eventos Dinamicos Narrativos y Dilemas del DT** `[DONE]`
- **feat-fase-36-club-history-records: Fase 36 - Historia del Club, Récords y Memoria Institucional** `[DONE]`
- **feat-fase-37-club-idols-legends: Fase 37 - Idolos, Leyendas y Retiro de Camisetas** `[DONE]`
- **feat-fase-38-hall-of-fame-records: Fase 38 - Salon de la Fama y Records Globales** `[DONE]`
- **feat-fase-39-achievements-career-challenges: Fase 39 - Sistema de Logros y Desafios de Carrera** `[DONE]`
- **feat-fase-40-endgame-epilogue-dynasty: Fase 40 - Endgame, Epilogo de Carrera y Legado Dinastico** `[DONE]`
- **fix-cup-match-dates: Copa Internacional: llaves en fechas fijas del calendario** `[DONE]`
- **fix-dashboard-stale-fixture: Inicio: no mostrar el partido ya jugado tras volver del post-partido** `[DONE]`
- **fix-goals-scored: Sumar los goles de cada jugador al consolidar el partido** `[DONE]`
- **fix-league-isolation: Aislar la liga por carrera: league_id en clubs, initializeLeague idempotente, Mercado y Tabla acotados** `[DONE]`
- **fix-locker-room-performance: Reuniones y charlas del vestuario: rapidas y con feedback** `[DONE]`
- **fix-manager-employment-state: Carrera del DT: no mostrar desempleado si el DT dirige un club** `[DONE]`
- **fix-milestones-duplicates: Hitos del club: sin duplicados al abrir la historia ni al apretar rapido** `[DONE]`
- **fix-repo-hygiene: Higiene del repo: sacar el HAR de 18 MB y proteger archivos con secretos** `[DONE]`
- **fix-scouting-column: Ojear: no escribir columnas inexistentes en scout_reports** `[DONE]`
- **fix-ui-copy-and-errors: Textos en castellano coloquial y errores amigables en toda la app** `[DONE]`
- **fix-youth-prospect-generator: Otear en la Academia: juvenil completo con todos los campos obligatorios** `[DONE]`
- **vercel-spa-rewrites: Rewrites SPA en Vercel (404 en rutas profundas)** `[DONE]`

## 💡 Lecciones Aprendidas y Anti-Patrones a Evitar

- **[BUG_FIX]** players tenía DOS columnas de moral (morale y state_morale): las charlas del vestuario escribían una y el Inicio/partidos leían la otra, así que nada se notaba *(Solución: Trigger sync_player_morale mantiene ambas iguales (migración scripts/db/migration_sync_player_morale.sql). Leer y escribir state_morale; ante columnas duplicadas en la base, unificar con trigger antes de tocar el código)*
- **[BUG_FIX]** Código y esquema derivan: se escribían columnas inexistentes (last_scouted_at en scout_reports) o faltaban NOT NULL (nationality en juveniles) y la pantalla fallaba con 400 *(Solución: Test que compara las columnas escritas con las reales de la base (tests/api/scouting.test.js, youthProspect.test.js). Consultar information_schema antes de escribir una API nueva)*
- **[BEST_PRACTICE]** Leer no debe escribir: getClubMilestones insertaba el hito de fundación si la lista estaba vacía y dos pantallas a la vez lo duplicaban *(Solución: Crear datos iniciales al crear la entidad (createClub) y proteger con índice único + upsert ignoreDuplicates (migration_milestones_unique.sql))*
- **[ARCHITECTURE]** Acciones asíncronas sin protección: dobles clics repetían acciones y no había señal de carga *(Solución: useAsyncClick + Button/AsyncButton bloquean y muestran spinner solos cuando onClick devuelve una promesa. Nuevo botón con acción async: usar Button o AsyncButton, nunca un <button> suelto)*
- **[ARCHITECTURE]** La copa continental era global y jugable en cualquier momento; el avance dependía de que el usuario jugara *(Solución: src/domain/cupTournament.js (puro): fechas fijas, clasificación por liga y planTournamentStep; internationalCupApi.syncTournament es idempotente. Cualquier competencia con fechas debe usar isDue y frenar el avance de semana si hay partido propio vencido)*
- **[BEST_PRACTICE]** El calendario de la carrera podía desfasarse de clubs.game_date (club restablecido): ERR_MATCH_MUST_BE_PLAYED_FIRST falso y avance que no cambiaba nada *(Solución: La fecha del club es la fuente de verdad: calendarApi.reconcileWithClub alinea semana y fecha; usar semana ABSOLUTA (domain/gameWeek.js) para enfriamientos que cruzan temporadas)*
- **[BEST_PRACTICE]** Los textos de la interfaz derivaban a Title Case, '&', inglés y errores crudos de la base *(Solución: friendlyError (src/lib/errors.js) en todo toast.error y tests/static/copy.test.js que lo impide; scripts/fix-copy.cjs para barridos)*
- **[BEST_PRACTICE]** Errores de proceso: git add -A coló archivos locales (.claude, docs con secretos) y una rama creada antes de que otra se mergeara falló en CI por falta de un archivo *(Solución: Agregar archivos por nombre (git add -u + rutas), excluir en .git/info/exclude, y crear cada rama desde master actualizado tras mergear la anterior (o mergear origin/master en la rama))*
- **[SECURITY]** RLS abierto a anon, resultados de copa y fechas FIFA calculados en el navegador, secreto de Google pegado en el chat, contraseña de BD histórica sin rotar *(Solución: Fase 5: cerrar RLS y mover cálculos a RPC; resetear secretos expuestos antes de la Fase 3 (login con Google))*
