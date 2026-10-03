# 🧠 Contexto y Memoria del Proyecto: dt_game

> **Última sincronización:** 2026-10-03T22:42:27.658Z | **Nodos:** 58 | **Tareas:** 6

## 📦 Mapa de Módulos y Dependencias

| Módulo | Líneas | Dependencias Principales |
|---|---|---|
| `src/features/club/screens/ClubScreen.jsx` | 554 | react, react-router-dom, ../../../api/club |
| `src/features/match/MatchScreen.jsx` | 477 | react, react-router-dom, ../../api/auth |
| `src/features/market/MarketScreen.jsx` | 408 | react, react-router-dom, ../../api/market |
| `src/features/dashboard/Dashboard.jsx` | 398 | react, react-router-dom, ../../api/auth |
| `src/features/manager/ManagerCareerScreen.jsx` | 391 | react, react-router-dom, ../../context/GameContext |
| `src/features/manager/NationalTeamScreen.jsx` | 365 | react, react-router-dom, ../../api/nationalTeam |
| `src/features/squad/SquadScreen.jsx` | 360 | react, react-router-dom, ../../api/auth |
| `src/api/internationalCup.js` | 315 | ./supabase, ./clubHistory, ./manager |
| `src/api/season.js` | 304 | ./supabase, ./competition, ./audit |
| `src/api/clubHistory.js` | 302 | ./supabase |
| `src/features/manager/CreateManagerWizard.jsx` | 302 | react, react-router-dom, ../../api/manager |
| `src/api/nationalTeam.js` | 291 | ./supabase, ./manager, ./audit |
| `src/features/competition/InternationalCupScreen.jsx` | 277 | react, react-router-dom, ../../api/internationalCup |
| `src/features/club/CreateClubWizard.jsx` | 259 | react, react-router-dom, ../../api/auth |
| `src/api/gameLoop.js` | 230 | ./supabase |
| `src/api/competition.js` | 213 | ./supabase |
| `src/features/match/PostMatchScreen.jsx` | 210 | react, react-router-dom, ../../api/postMatch |
| `src/features/finances/FinancesScreen.jsx` | 203 | react, react-router-dom, ../../api/auth |
| `src/features/tactics/TacticsScreen.jsx` | 198 | react, react-router-dom, ../../api/auth |
| `src/api/market.js` | 177 | ./supabase, ./club |
| `src/features/auth/AuthScreen.jsx` | 163 | react, react-router-dom, ../../api/auth |
| `src/features/competition/StandingsScreen.jsx` | 163 | react, react-router-dom, ../../api/auth |
| `src/api/career.js` | 160 | ./supabase, ./audit |
| `src/api/matchEngine.js` | 141 | ninguna |
| `src/features/training/TrainingScreen.jsx` | 137 | react, react-router-dom, lucide-react |

_(+27 módulos adicionales; consultar con `memory:query`)_

## 📋 Tareas Registradas

- **f2-33-national-teams: Fase 33: Selecciones Nacionales y Doble Carrera** `[DONE]`
- **f2-34-international-cups: Fase 34: Competiciones Internacionales y Copas Continentales** `[DONE]`
- **f2-36-37-club-history-idols: Fases 36 y 37: Historia del Club, Récords e Ídolos** `[DONE]`
- **f2-audit-fixes-polish: Fixes y Mejoras de Auditoria Manual PWA y Mobile UX** `[DONE]`
- **f2-db-audit-optimization: Optimizacion de Indices y Politicas RLS en Base de Datos** `[DONE]`
- **f2-db-deep-fixes: Correccion de FK erronea en managers e indexacion total de FKs** `[DONE]`
