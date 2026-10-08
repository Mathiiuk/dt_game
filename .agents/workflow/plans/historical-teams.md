# Implementation Plan — historical-teams

## 1. Resumen
Implementar la base de datos de clubes históricos de la tabla de Promiedos distribuidos en las 5 divisiones del juego (Primera División hasta Torneo Regional / Potrero). Dotar a cada club de nombre oficial, sigla única, ciudad, colores primario y secundario, año de fundación, nombre del estadio y capacidad real. Integrar en `pickRivalClubs` la capacidad de sortear rivales específicos de la categoría del club con exclusiones para que nunca se repita el club del usuario.

## 2. Repositorio inspeccionado
- Stack: React 18, Vite, Supabase Client, Tailwind CSS v4, Vitest, Cucumber.js.
- Runtime: Node.js (Windows).
- Package manager: pnpm.
- Branch base: `feat/finances-v2-d4-rediseno-arcade-tycoon-de-finanzas-con-billetera-roi-y-balance-semanal`
- Rama de trabajo: `feat/historical-teams-agregar-clubes-historicos-de-promiedos-adaptados-por-categorias-desde-potrero`
- CI actual: GitHub Actions con pnpm test, pnpm test:bdd, pnpm lint (máx 13 warnings), pnpm build.

## 3. Cambios propuestos

### [NEW]
- `src/domain/historicalClubs.js`: Catálogo de ~140 clubes históricos del fútbol argentino agrupados por categoría (Tiers 1 a 5) con datos de identidad, colores y estadios.

### [MODIFY]
- `src/domain/rivalClubs.js`: Re-exportar catálogo, definir `TIER_RIVAL_POOLS`, y actualizar `pickRivalClubs` para admitir `{ tier, exclude }` conservando compatibilidad con la firma anterior.
- `src/api/competition.js`: Pasar `{ tier: 5, exclude }` en `_initializeLeague`, y `{ tier: newTier }` o `{ tier: oldTier }` en `prepareNextLeague`, inyectando estadio, capacidad, ciudad y colores reales en las filas de clubes.
- `tests/domain/rivalClubs.test.js`: Validar unicidad de nombres y siglas de todo el catálogo, disponibilidad de más de 25 clubes por categoría, sorteo determinista por categoría, exclusión y compatibilidad de firmas.
- `.agents/workflow/features/historical-teams.feature`: Escenarios BDD `@auto` verificando la generación de rivales por categoría desde Potrero.
- `tests/bdd/steps/league.steps.js`: Pasos ejecutables para los escenarios de clubes históricos.

## 4. Estrategia de implementación
1. Crear `src/domain/historicalClubs.js` con las 5 categorías y verificar con un script rápido que no haya ningún duplicado en `name` ni en `short_name`.
2. Actualizar `src/domain/rivalClubs.js` para usar el nuevo catálogo, preservando retrocompatibilidad para `pickRivalClubs(seed, count, exclude)` y añadiendo soporte para `options = { tier, exclude }`.
3. Actualizar `src/api/competition.js` para usar la categoría correspondiente en `_initializeLeague` y `prepareNextLeague`.
4. Extender `tests/domain/rivalClubs.test.js` con pruebas específicas de categorías, estadios y atributos.
5. Agregar escenarios BDD `@auto` y pasos en `tests/bdd/steps/league.steps.js`.
6. Correr los Quality Gates: `pnpm test`, `pnpm test:bdd`, `pnpm lint`, `pnpm build`.
7. Concluir tarea y generar reporte de ejecución.

## 5. Migraciones / datos
No se requieren migraciones SQL; las columnas en la tabla `clubs` ya existen en el esquema Supabase (`name`, `short_name`, `city`, `colors`, `stadium_name`, `stadium_capacity`, `league_tier`, `founded_year`).

## 6. Seguridad
No se manejan datos sensibles de usuarios. Toda la generación es determinista en cliente/servidor.

## 7. Observabilidad
Errores en inserciones de clubes continúan registrándose mediante `console.warn` y capturados por la idempotencia existente.

## 8. Compatibilidad / rollback
Totalmente compatible hacia atrás: llamadas a `pickRivalClubs(seed, count, exclude)` siguen funcionando sin cambios.

## 9. Plan de verificación
- [x] Lint (`pnpm lint`) <= 13 warnings.
- [x] Unit (`pnpm test`) 100% verde.
- [x] BDD (`pnpm test:bdd`) 100% verde.
- [x] Build (`pnpm build`) compilación limpia de Vite.

## 10. Definition of Done
Todos los criterios de aceptación de la especificación cubiertos, todos los Quality Gates en verde y cambios commiteados en la rama semántica.

## 11. Aprobación requerida
- [x] No requerida
