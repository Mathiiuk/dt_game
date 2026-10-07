# Specification — tooling-cucumber

## 1. Objetivo
Que el gate BDD del flujo de trabajo corra de verdad: Cucumber instalado, escenarios ejecutables y todo el resto validado por sintaxis.

## 2. Problema actual
No existía `pnpm test:bdd`: el gate fallaba y se desactivaba en cada tarea. Los 148 archivos `.feature` eran solo documentación, y 6 estaban en español sin la marca de idioma (no se podían leer).

## 3. Resultado esperado
- `npm run test:bdd` ejecuta los escenarios marcados `@auto` (hoy: calendario de liga y fin de temporada, con sus pasos en `tests/bdd/steps`).
- `npm run test:bdd:docs` valida la sintaxis de todos los `.feature` sin ejecutarlos (739 escenarios).
- El CI corre `test:bdd` junto a las pruebas unitarias.

## 4. Alcance
Incluido: dependencia, scripts, 6 archivos en español, 2 features ejecutables, CI.
No incluido: pasos para los otros 737 escenarios (se vuelven ejecutables de a poco: se marca `@auto` y se escriben los pasos cuando una tarea toque esa área).

## 5. Criterios de aceptación
- [x] AC-01: `test:bdd` pasa con 6 escenarios ejecutados.
- [x] AC-02: `test:bdd:docs` lee todos los `.feature` sin errores de sintaxis.
- [x] AC-03: el CI incluye el paso.
- [x] AC-04: `agt task:verify` con `bdd_tests` activo pasa.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/tooling-cucumber.yml`
