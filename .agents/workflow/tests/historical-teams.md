# Test Plan — historical-teams

## 1. Objetivo
Validar que el catálogo de clubes históricos del fútbol argentino (Promiedos y pirámide de ligas) se encuentre completo, sin duplicados ni colisiones de siglas, y que la asignación de rivales por categoría se realice de forma determinista asignando identidad visual (colores) y estadios reales a los clubes en cada división del juego.

## 2. Riesgos a validar
- Colisión de siglas de 3 letras entre clubes con nombres parecidos.
- Ausencia de datos obligatorios en estadios, capacidades o colores HEX.
- Generación con menos de 19 clubes en cualquier categoría.
- Inclusión del propio club del usuario como rival en su misma liga.

## 3. Unit tests
- [x] `tests/domain/rivalClubs.test.js` (11 tests):
  - `hay un pozo grande con más de 120 clubes sin nombres ni siglas repetidas`: Pasa.
  - `cada una de las 5 categorías tiene al menos 25 clubes reales`: Pasa.
  - `todos los clubes tienen atributos completos de identidad, colores y estadios reales`: Pasa.
  - `la misma carrera siempre tiene los mismos 19 rivales, sin repetidos`: Pasa.
  - `carreras distintas tienen rivales distintos`: Pasa.
  - `se puede excluir un nombre (el del club del jugador)`: Pasa.
  - `respeta la cantidad pedida`: Pasa.
  - `al solicitar rivales para la categoría 5 (Potrero), devuelve clubes de esa categoría`: Pasa.
  - `al solicitar rivales para Primera División (tier 1), devuelve clubes de primera`: Pasa.
  - `al excluir el club del jugador dentro de una categoría, no lo incluye`: Pasa.
  - `admite la firma opcional con tier como cuarto parámetro`: Pasa.

## 4. Integration tests
- [x] `tests/api/seasonPrize.test.js`: Validación de transición de liga y preservación de rivales. Pasa.
- [x] `tests/api/competition-sim.test.js`: Simulación de fechas con rivales de la categoría. Pasa.

## 5. BDD tests
- [x] `.agents/workflow/features/historical-teams.feature` & `tests/bdd/steps/historical-teams.steps.js`:
  - Escenario 1: Generación de rivales para la liga de Potrero (`@auto`). Pasa.
  - Escenario 2: Generación de rivales para Primera División (`@auto`). Pasa.
  - Escenario 3: Exclusión del club del usuario para no duplicar en la categoría (`@auto`). Pasa.
- Total BDD: 60 escenarios pasaron (100%).

## 6. Regression tests
- [x] 157 archivos de tests de Vitest, 1.311 pruebas unitarias pasando.
- [x] `tests/static/clubColumns.test.js`: Sin columnas no permitidas en `clubs`.

## 7. Security checks
- [x] No hay exposición de credenciales ni inyecciones de parámetros externos.

## 8. Smoke tests
- [x] `pnpm build`: Build exitoso en 1.76s.
- [x] `pnpm lint`: 13 advertencias (cumple `--max-warnings=13`).

## 9. Evidencia requerida
- Comandos ejecutados: `pnpm test`, `pnpm test:bdd`, `pnpm lint`, `pnpm build`.
- Resultado: 100% verde en todos los Quality Gates.

## 10. Resultado
`PASSED`
