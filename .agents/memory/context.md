# 🧠 Contexto y Memoria del Proyecto: dt_game

> **Última sincronización:** 2026-10-04T02:40:58.748Z | **Nodos:** 91 | **Tareas:** 28

## 📦 Mapa de Módulos y Dependencias

| Módulo | Líneas | Dependencias Principales |
|---|---|---|
| `src/features/squad/SquadScreen.jsx` | 787 | react, react-router-dom, ../../api/player |
| `src/features/manager/CreateManagerWizard.jsx` | 585 | react, react-router-dom, ../../api/manager |
| `src/api/achievements.js` | 566 | ./supabase, ./career, ./hallOfFame |
| `src/features/club/screens/ClubScreen.jsx` | 566 | react, react-router-dom, ../../../api/club |
| `src/features/dashboard/Dashboard.jsx` | 547 | react, react-router-dom, ../../api/dashboard |
| `src/features/match/MatchScreen.jsx` | 525 | react, react-router-dom, ../../api/auth |
| `src/features/auth/AuthScreen.jsx` | 464 | react, react-router-dom, ../../api/auth |
| `src/features/match/PostMatchScreen.jsx` | 452 | react, react-router-dom, ../../api/postMatch |
| `src/features/club/CreateClubWizard.jsx` | 450 | react, react-router-dom, ../../api/auth |
| `src/api/contracts.js` | 445 | ./supabase, ../utils/cache, ./audit |
| `src/features/career/AchievementsScreen.jsx` | 430 | react, react-router-dom, ../../context/GameContext |
| `src/api/auth.js` | 428 | ./supabase, ../utils/cache, ./audit |
| `src/features/training/TrainingScreen.jsx` | 422 | react, react-router-dom, lucide-react |
| `src/api/matchEngine.js` | 409 | ./supabase |
| `src/features/market/MarketScreen.jsx` | 408 | react, react-router-dom, ../../api/market |
| `src/features/manager/ManagerCareerScreen.jsx` | 386 | react, react-router-dom, ../../context/GameContext |
| `src/api/calendar.js` | 376 | ./supabase |
| `src/features/tactics/TacticsScreen.jsx` | 376 | react, react-router-dom, lucide-react |
| `src/api/training.js` | 372 | ./supabase |
| `src/api/competition.js` | 366 | ./supabase, ../utils/cache |
| `src/features/manager/NationalTeamScreen.jsx` | 365 | react, react-router-dom, ../../api/nationalTeam |
| `src/api/market.js` | 321 | ./supabase, ../utils/cache |
| `src/features/manager/HallOfFameScreen.jsx` | 321 | react, react-router-dom, ../../api/hallOfFame |
| `src/api/tactics.js` | 317 | ./supabase, ../utils/cache |
| `src/api/internationalCup.js` | 315 | ./supabase, ./clubHistory, ./manager |

_(+38 módulos adicionales; consultar con `memory:query`)_

## 📋 Tareas Registradas

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
- **f2-db-audit-optimization: Optimizacion de Indices y Politicas RLS en Base de Datos** `[DONE]`
- **f2-db-deep-fixes: Correccion de FK erronea en managers e indexacion total de FKs** `[DONE]`
- **f2-perf-optimization: Optimizacion de Rendimiento de Navegacion y Cache de Consultas** `[DONE]`
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
