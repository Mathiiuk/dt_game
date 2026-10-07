# 🧠 Contexto y Memoria del Proyecto: dt_game

> **Última sincronización:** 2026-10-07T15:28:06.971Z | **Nodos:** 546 | **Tareas:** 176

## 📦 Mapa de Módulos y Dependencias

| Módulo | Líneas | Dependencias Principales |
|---|---|---|
| `src/domain/arcCatalog.js` | 908 | ninguna |
| `src/api/career.js` | 783 | ../domain/vacancies, ../domain/jobNegotiation, ./supabase |
| `src/features/match/MatchScreen.jsx` | 659 | react, react-router-dom, ../../api/auth |
| `src/api/matchEngine.js` | 615 | ./supabase, ../domain/positions, ../domain/consequences |
| `src/api/press.js` | 590 | ./supabase, ../domain/press, ../domain/characters |
| `src/api/postMatch.js` | 581 | ./manager, ./morale, ./supabase |
| `src/features/match/PostMatchScreen.jsx` | 575 | react, react-router-dom, ../../api/postMatch |
| `src/api/achievements.js` | 566 | ./supabase, ./career, ./hallOfFame |
| `src/api/climate.js` | 548 | ./supabase, ../utils/cache, ./morale |
| `src/api/calendar.js` | 538 | ./supabase, ../domain/fixtureStatus, ../domain/gameWeek |
| `src/api/events.js` | 527 | ./supabase, ../utils/cache, ./audit |
| `src/features/squad/SquadScreen.jsx` | 514 | react, lucide-react, sonner |
| `src/api/nationalTeam.js` | 491 | ./supabase, ./manager, ./audit |
| `src/api/auth.js` | 484 | ./supabase, ../utils/cache, ./audit |
| `src/features/club/screens/LockerRoomTab.jsx` | 460 | react, lucide-react, ../../../api/lockerRoom |
| `src/features/manager/ManagerCareerScreen.jsx` | 450 | react, react-router-dom, lucide-react |
| `src/features/dashboard/Dashboard.jsx` | 435 | react, react-router-dom, lucide-react |
| `src/api/clubHistory.js` | 423 | ./supabase |
| `src/api/training.js` | 422 | ./supabase, ../domain/squadConsequences |
| `src/api/injuries.js` | 407 | ./supabase, ../utils/cache |
| `src/domain/climateEvents.js` | 397 | ninguna |
| `src/api/lockerRoom.js` | 395 | ./supabase, ../utils/cache |
| `src/features/tactics/TacticsScreen.jsx` | 393 | react, lucide-react, sonner |
| `src/features/club/screens/StadiumManagementTab.jsx` | 389 | react, lucide-react, ../../../api/stadium |
| `src/api/contracts.js` | 386 | ./supabase, ../utils/cache, ./audit |

_(+188 módulos adicionales; consultar con `memory:query`)_

## 📋 Tareas Registradas

- **advance-semaphore-recovery: El avance de semana se recupera si quedo trabado a medias** `[DONE]`
- **arc-branching-endings: Los finales de las historias cambian segun el camino elegido y el estado del club** `[DONE]`
- **auth-security-f5: Acceso seguro: reCAPTCHA v3, Google, Resend y base cerrada por dueño** `[DONE]`
- **bench-complaints: Suplentes que reclaman minutos** `[DONE]`
- **board-balance-calibration: La confianza de la directiva es una funcion pura calibrada con simulacion** `[DONE]`
- **buyback-clause: Clausula de recompra: dejas una opcion al vender y la ejerces despues** `[DONE]`
- **cash-server-migrate-rest: El resto de las escrituras de caja pasan al servidor** `[DONE]`
- **cash-server-primitive: La caja se mueve en el servidor: primitiva club_cash_move y las primeras escrituras migradas** `[DONE]`
- **characters: Personajes con nombre y memoria** `[DONE]`
- **ci-auto-merge-retry: Auto-merge resistente a pushes concurrentes** `[DONE]`
- **cleanup-orphans-multipass: El script de limpieza de filas sin dueño borra en pasadas y respeta las dependencias** `[DONE]`
- **climate-feel: Combos, clima visible, resumen de temporada y premios escalados** `[DONE]`
- **climate-stage-events: Eventos propios de cada etapa de la barra y de cada nivel de presion** `[DONE]`
- **consequences-barra-t4: T4 barra, corrupcion y eventos por clima** `[DONE]`
- **consequences-results-t2: T2 consecuencias de resultados, precio de entrada y ambiente** `[DONE]`
- **consequences-squad-t3: T3 consecuencias de entrenamiento y plantel** `[DONE]`
- **consequences-ui-t6: T6 avisos, feed, tarjeta de clima y dificultad** `[DONE]`
- **contracts-countdown-alert: La alerta de contratos por vencer sube de prioridad al final de la temporada** `[DONE]`
- **contracts-server: Contratos: renovaciones y rescisiones resueltas por el servidor** `[DONE]`
- **cup-prizes-server: Premios de la copa liquidados por el servidor** `[DONE]`
- **cup-two-legs: Copa continental con ida y vuelta** `[DONE]`
- **db-function-search-path: Las funciones SQL del juego tienen el search_path fijo** `[DONE]`
- **econ-climate-t1: T1 economia recalibrada y clima unificado** `[DONE]`
- **econ-climate-t1b: T1b hinchada y dirigencia unificadas y rachas reales** `[DONE]`
- **economy-by-tier: Los ingresos fijos del club crecen con la categoria** `[DONE]`
- **economy-tuning: Economia semanal recalibrada con la corrida de una temporada** `[DONE]`
- **endgame-tests: Epilogo probado y auditoria del retiro corregida** `[DONE]`
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
- **feat-positions-and-ratings: Posiciones unificadas (PO DFC LI LD MCD MC MCO MI MD EI ED DC) y medias estilo FIFA por posicion** `[DONE]`
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
- **free-lineup-m4: M4 alineacion libre en la pizarra** `[DONE]`
- **gate-server: La taquilla la calcula y acredita el servidor** `[DONE]`
- **home-landing: Home publica de Vestuario: portada, frases de DT, SEO y rutas de acceso** `[DONE]`
- **job-market-real-tiers: La bolsa de trabajo ofrece clubes de todas las divisiones** `[DONE]`
- **job-negotiation: Las ofertas de trabajo se negocian: pedis mas sueldo y el club acepta, contraoferta o retira** `[DONE]`
- **league-home-away-balance: El calendario de liga reparte local y visitante parejo** `[DONE]`
- **league-promotion-relegation: Ascensos y descensos reales: el club cambia de liga y los rivales de la IA rotan** `[DONE]`
- **league-server: Liga con fuerza real de rivales y resultados en el servidor** `[DONE]`
- **lineup-chemistry-m4: M4 quimica del equipo en la pizarra y el partido** `[DONE]`
- **lint-warnings-cleanup: Menos avisos de lint: variables sin uso y asignaciones pisadas** `[DONE]`
- **lint-warnings-cleanup-2: Menos avisos de lint: variables sin uso y asignaciones pisadas, segunda pasada** `[DONE]`
- **market-agents: Mercado 2.0 etapa 4: representantes cobran comision en el servidor y los pedidos de salida dan drama** `[DONE]`
- **market-consequences: Mercado 2.0 etapa 3: fichajes y ventas con consecuencias en sueldos, caja y vestuario** `[DONE]`
- **market-negotiation: Mercado 2.0 etapa 2: negociacion con contraofertas y cuotas en el servidor** `[DONE]`
- **market-sales: Mercado 2.0 etapa 2b: las ventas las resuelve el servidor** `[DONE]`
- **market-server-prices: Mercado 2.0 etapa 1: precios a escala y fichajes resueltos por el servidor** `[DONE]`
- **market-window-and-pool: Mercado: ventana mal calculada por zona horaria y sin candidatos (los rivales no tienen plantel)** `[DONE]`
- **match-experience-m5: M5 pausa, velocidades y saltear partido** `[DONE]`
- **match-moments-2: Decisiones en partido: penales, arquero lesionado y rival que reacciona** `[DONE]`
- **match-substitutions: Cambios de jugadores durante la pausa del partido** `[DONE]`
- **memory-lessons-2: Lecciones de la tanda de contenido y calidad** `[PLANNED]`
- **more-story-arcs: 12 historias nuevas escritas por el usuario** `[DONE]`
- **performance-m2: M2 rendimiento del avance semanal, post-partido y Plantel** `[DONE]`
- **performance-m2b: M2 segunda pasada: profundidad de consultas** `[DONE]`
- **player-loans: Cesiones a prestamo: ahorras el sueldo y el jugador vuelve al cierre de la temporada** `[DONE]`
- **preseason-arcade: Pretemporada arcade: aporte de la dirigencia y amistosos con riesgo** `[DONE]`
- **press-flow: Flujo del final del partido y rueda de prensa relampago** `[DONE]`
- **press-games: Prensa: Titular o fake y Bingo del DT** `[DONE]`
- **press-situations: La prensa pregunta por la situacion y recuerda tus respuestas anteriores** `[DONE]`
- **press-skip-t5: T5 rueda de prensa obligatoria omitible** `[DONE]`
- **quick-decisions: Decisiones rapidas en el partido que cambian el resultado** `[DONE]`
- **recaptcha-env-name: Clave del sitio de reCAPTCHA sin prefijo VITE** `[DONE]`
- **rival-names: Rivales distintos en cada carrera** `[DONE]`
- **rls-owner-nullable: La migracion RLS falla con filas existentes: owner_user_id nulo permitido** `[DONE]`
- **scout-insights: El ojeo da una lectura: si mejora al titular, si el precio es justo y el perfil del jugador** `[DONE]`
- **season-close-flow: La temporada se cierra desde la gala y arranca la siguiente con su calendario** `[DONE]`
- **season-expiring-contracts: La gala avisa que jugadores quedan libres al cerrar la temporada** `[DONE]`
- **season-league-isolation: Cierre de temporada solo de la liga del club** `[DONE]`
- **season-prize-server: Premio de fin de temporada liquidado por el servidor** `[DONE]`
- **server-results-f5: Resultados de copa y fechas FIFA decididos por el servidor** `[DONE]`
- **stale-dashboard-after-actions: Pantallas desactualizadas tras resolver un evento o jugar un partido; texto de años del contrato** `[DONE]`
- **story-arcs: Historias de 8 a 10 fechas con humor del futbol argentino** `[DONE]`
- **supabase-errors-not-ignored: Los errores de consulta no se ignoran: no se duplican ligas ni planteles ni se saltea el chequeo de fondos** `[DONE]`
- **tooling-cucumber: Cucumber instalado y el gate BDD corre de verdad** `[DONE]`
- **tooling-eslint: ESLint instalado y corriendo en el CI** `[DONE]`
- **ui-season-details: La pantalla muestra la division real y la gala el premio que corresponde** `[DONE]`
- **vercel-spa-rewrites: Rewrites SPA en Vercel (404 en rutas profundas)** `[DONE]`
- **weekly-finance-server: Cierre semanal de finanzas resuelto por el servidor** `[DONE]`
- **year-in-review: El resumen del año cuenta fichajes y el ranking de decisiones** `[DONE]`

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
- **[ARCHITECTURE]** Posiciones y medias: cada módulo usaba su propio set de códigos (GK/DF/MD/FW, DEF/MED/DEL, CB/CM/ST) y el motor de partido ignoraba el puesto en que juega cada jugador, así que poner un arquero de delantero no cambiaba nada *(Solución: Fuente única src/domain/positions.js (PO DFC LI LD MCD MC MCO MI MD EI ED DC; puestos con número DFC1) y src/domain/ratings.js (pesos por posición, ratingAtSlot). buildMatchSquad asigna slot_rating y el motor pesa por puesto. Toda posición nueva pasa por normalizePosition)*
- **[ARCHITECTURE]** La media (attr_overall) se calculaba en varios lugares y se desfasaba; la base tenía overall generada y attr_overall sin generar *(Solución: Trigger sync_player_overall en la base con pesos generados desde ratings.js por scripts/gen-rating-sql.mjs; test estático rating-sql.test.js obliga a regenerar el SQL si cambian los pesos. Nunca escribir attr_overall a mano)*
- **[BUG_FIX]** Alineaciones guardadas como 'mejores 11' sin respetar puestos (un delantero en el arco) y reemplazo de juveniles de academia sin nacionalidad ni dorsal válido *(Solución: resolveLineup reubica alineaciones desordenadas (tolerancia 5 puntos) en pizarra y partido; buildProspectRow arma filas completas de players para juveniles y promociones)*
- **[BUG_FIX]** new Date('YYYY-MM-DD') es medianoche UTC: en Argentina (UTC-3) el 1 de julio cae el 30 de junio y getMonth() devuelve junio (mercado 'cerrado', año de temporada mal). *(Solución: Leer mes y año del texto de la fecha (slice) o con helpers de domain/gameWeek (seasonYearOf, weekOfDate, absoluteWeek); nunca new Date(game_date) con getMonth/getFullYear.)*
- **[SECURITY]** RLS 'activada' no es RLS 'aplicada': pg_tables.rowsecurity engaña si las políticas son true. Se creyó aplicada la aislación por cuenta cuando 103 de 109 políticas seguían abiertas. *(Solución: Verificar con pg_policies (qual/with_check = 'true', columna owner_user_id) y probar como usuario autenticado dentro de una transacción que se deshace (set local role authenticated + request.jwt.claims).)*
- **[ARCHITECTURE]** Todo movimiento de plata o resultado va en funciones SQL SECURITY INVOKER (respetan RLS por dueño) con la fórmula duplicada en domain/*.js y tests de paridad contra valores fijos de la base; el navegador solo propone montos. *(Solución: Probar cada función en la base real con un bloque DO que termina en RAISE EXCEPTION para deshacer; cerrar el camino directo (execute_transfer) para que no se saltee las reglas; triggers con GUC app.server_result para bloquear escrituras directas.)*
- **[BUG_FIX]** Cuenta real en el navegador encontró lo que los 1000 tests no: mercado vacío (rivales sin plantel), pantallas desactualizadas tras resolver eventos (efecto con deps que no cambian) y caja vieja tras un partido. *(Solución: Después de cada tanda grande, recorrer el flujo con la cuenta real; consultar la base con SQL para confirmar lo que el navegador muestra; refrescar contexto al volver de pantallas que escriben.)*
- **[BEST_PRACTICE]** El gate bdd_tests del manifiesto falla porque @cucumber/cucumber no está instalado y no existe el script test:bdd; los .feature generados quedan como plantilla. *(Solución: Hasta decidir instalarlo, las tareas se marcan bdd_tests:false y los .feature se escriben como documentación viva con escenarios reales.)*
- **[BUG_FIX]** El premio de goleador del cierre de temporada leía players.goals_season, una columna que no existe: la consulta fallaba en silencio y el bono jamás se pagó. Un select con columna inexistente devuelve error, no datos. *(Solución: Verificar columnas contra information_schema antes de escribir consultas; contar goles del relato (match_events) y probar la función en la base real.)*
- **[BEST_PRACTICE]** Al sumar eventos aleatorios nuevos a un motor determinista por semilla, usar un generador aparte (seed:pen) para no alterar el resto del partido ni los tests estadísticos existentes. *(Solución: createRNG con semilla derivada para cada fuente de azar nueva; subir el tamaño de muestra de los tests estadísticos si los totales se mueven.)*
- **[BUG_FIX]** Correr el juego de punta a punta en el navegador destapo 3 bugs que los tests no veian: calendario de liga sin localia pareja, gala de fin de temporada inalcanzable (leia clubs.current_week que no existe; la semana real sale de la fecha de juego con domain/gameWeek) y consulta de la tabla con clubs.logo_url inexistente que fallaba en silencio. Una consulta de Supabase con una columna inexistente devuelve error y data null: siempre chequear error. *(Solución: )*
- **[BEST_PRACTICE]** Calibrar un balance con una simulacion fijada en un test (ej. la confianza de la directiva: 2000 temporadas por celda) evita ajustar numeros a ojo y deja el criterio documentado. Extraer la parte numerica a una funcion pura en domain/ la hace probable y reutilizable desde Cucumber. *(Solución: )*
- **[ARCHITECTURE]** Toda escritura de plata pasa por funciones SQL (club_cash_move, settle_gate, close_week_finances...) y un trigger rechaza cambios directos de clubs.budget: una funcion nueva que toque la caja debe fijar app.server_result en su cuerpo (ALTER FUNCTION SET con parametro propio no esta permitido en Supabase). Las reglas del servidor se prueban en la base real con un bloque DO que termina en raise exception. *(Solución: )*
