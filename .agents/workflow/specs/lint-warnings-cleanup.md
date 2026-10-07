# Specification — lint-warnings-cleanup

## 1. Objetivo
Bajar el tope de avisos de ESLint de 54 a 46 quitando código muerto sin riesgo.

## 2. Cambios
Imports sin uso (`queryCache` en agents y press, `auditApi` en staff, `dueUserFixture` e `isDue` en internationalCup), propiedades sin uso de `ClubHistoryTab` y una variable sin uso de `AgentProfileCard`. El tope de `npm run lint` baja a 46.

## 3. Hallazgo (no corregido a propósito)
Cinco lugares ignoran el `error` de una consulta de Supabase (`competition.js` getStandings, `calendar.js`, `training.js`, `player.js` y `events.js`): es la misma clase de fallo silencioso que ocultaba `clubs.logo_url`. Corregirlos cambia el comportamiento (hoy ante un error la app sigue con datos vacíos), por eso va como tarea aparte en el roadmap.

## 5. Criterios de aceptación
- [x] AC-01: 46 avisos o menos y 0 errores.
- [x] AC-02: suite de tests sin cambios.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/lint-warnings-cleanup.yml`
