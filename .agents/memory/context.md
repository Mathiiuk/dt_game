# 🧠 Contexto y Memoria del Proyecto: dt_game

> **Última sincronización:** 2026-10-04T00:13:09.465Z | **Nodos:** 69 | **Tareas:** 10

## 📦 Mapa de Módulos y Dependencias

| Módulo | Líneas | Dependencias Principales |
|---|---|---|
| `src/api/achievements.js` | 566 | ./supabase, ./career, ./hallOfFame |
| `src/features/club/screens/ClubScreen.jsx` | 566 | react, react-router-dom, ../../../api/club |
| `src/features/match/MatchScreen.jsx` | 477 | react, react-router-dom, ../../api/auth |
| `src/features/dashboard/Dashboard.jsx` | 444 | react, react-router-dom, ../../api/auth |
| `src/features/career/AchievementsScreen.jsx` | 430 | react, react-router-dom, ../../context/GameContext |
| `src/features/market/MarketScreen.jsx` | 408 | react, react-router-dom, ../../api/market |
| `src/features/manager/ManagerCareerScreen.jsx` | 386 | react, react-router-dom, ../../context/GameContext |
| `src/features/squad/SquadScreen.jsx` | 368 | react, react-router-dom, ../../api/auth |
| `src/features/manager/NationalTeamScreen.jsx` | 365 | react, react-router-dom, ../../api/nationalTeam |
| `src/features/manager/HallOfFameScreen.jsx` | 321 | react, react-router-dom, ../../api/hallOfFame |
| `src/api/internationalCup.js` | 315 | ./supabase, ./clubHistory, ./manager |
| `src/api/season.js` | 304 | ./supabase, ./competition, ./audit |
| `src/api/clubHistory.js` | 302 | ./supabase |
| `src/features/manager/CreateManagerWizard.jsx` | 302 | react, react-router-dom, ../../api/manager |
| `src/api/nationalTeam.js` | 291 | ./supabase, ./manager, ./audit |
| `src/features/competition/InternationalCupScreen.jsx` | 277 | react, react-router-dom, ../../api/internationalCup |
| `src/features/club/CreateClubWizard.jsx` | 259 | react, react-router-dom, ../../api/auth |
| `src/features/career/EndgameScreen.jsx` | 255 | react, react-router-dom, ../../context/GameContext |
| `src/api/competition.js` | 240 | ./supabase, ../utils/cache |
| `src/api/gameLoop.js` | 230 | ./supabase |
| `src/features/match/PostMatchScreen.jsx` | 210 | react, react-router-dom, ../../api/postMatch |
| `src/features/finances/FinancesScreen.jsx` | 208 | react, react-router-dom, ../../api/auth |
| `src/features/tactics/TacticsScreen.jsx` | 208 | react, react-router-dom, ../../api/auth |
| `src/api/endgame.js` | 194 | ./supabase, ./career, ./hallOfFame |
| `src/features/competition/StandingsScreen.jsx` | 186 | react, react-router-dom, ../../api/auth |

_(+34 módulos adicionales; consultar con `memory:query`)_

## 📋 Tareas Registradas

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
