# 🧠 Contexto y Memoria del Proyecto: dt_game

> **Última sincronización:** 2026-10-04T03:58:26.153Z | **Nodos:** 143 | **Tareas:** 49

## 📦 Mapa de Módulos y Dependencias

| Módulo | Líneas | Dependencias Principales |
|---|---|---|
| `src/features/squad/SquadScreen.jsx` | 859 | react, react-router-dom, ../../api/player |
| `src/features/manager/ManagerCareerScreen.jsx` | 809 | react, react-router-dom, ../../context/GameContext |
| `src/api/career.js` | 757 | ./supabase, ./audit, ../utils/cache |
| `src/api/contracts.js` | 735 | ./supabase, ../utils/cache, ./audit |
| `src/features/club/screens/ClubScreen.jsx` | 735 | react, react-router-dom, ../../../api/club |
| `src/features/dashboard/Dashboard.jsx` | 628 | react, react-router-dom, ../../api/dashboard |
| `src/features/match/PostMatchScreen.jsx` | 589 | react, react-router-dom, ../../api/postMatch |
| `src/features/manager/CreateManagerWizard.jsx` | 585 | react, react-router-dom, ../../api/manager |
| `src/api/achievements.js` | 566 | ./supabase, ./career, ./hallOfFame |
| `src/features/match/MatchScreen.jsx` | 525 | react, react-router-dom, ../../api/auth |
| `src/api/nationalTeam.js` | 494 | ./supabase, ./manager, ./audit |
| `src/features/club/screens/LockerRoomTab.jsx` | 480 | react, lucide-react, ../../../api/lockerRoom |
| `src/features/auth/AuthScreen.jsx` | 464 | react, react-router-dom, ../../api/auth |
| `src/api/events.js` | 452 | ./supabase, ../utils/cache, ./audit |
| `src/features/finances/FinancesScreen.jsx` | 451 | react, react-router-dom, ../../api/finances |
| `src/features/club/CreateClubWizard.jsx` | 450 | react, react-router-dom, ../../api/auth |
| `src/api/calendar.js` | 431 | ./supabase |
| `src/features/career/AchievementsScreen.jsx` | 430 | react, react-router-dom, ../../context/GameContext |
| `src/api/auth.js` | 428 | ./supabase, ../utils/cache, ./audit |
| `src/features/training/TrainingScreen.jsx` | 422 | react, react-router-dom, lucide-react |
| `src/api/injuries.js` | 420 | ./supabase, ../utils/cache |
| `src/features/market/MarketScreen.jsx` | 411 | react, react-router-dom, ../../api/market |
| `src/api/matchEngine.js` | 409 | ./supabase |
| `src/api/lockerRoom.js` | 408 | ./supabase, ../utils/cache |
| `src/features/manager/NationalTeamScreen.jsx` | 403 | react, react-router-dom, ../../api/nationalTeam |

_(+69 módulos adicionales; consultar con `memory:query`)_

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
