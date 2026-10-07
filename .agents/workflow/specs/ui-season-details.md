# Specification — ui-season-details

## 1. Objetivo
Que la pantalla muestre la división real del club y que la gala de fin de temporada muestre lo que corresponde al puesto actual.

## 2. Problema actual
El inicio y la tabla decían siempre "Torneo Regional · Tier 5" aunque el club ascendiera, y la gala mostraba "$1.000 a $12.000" y "80% de la masa salarial" fijos, sin importar el puesto ni el ascenso.

## 3. Resultado esperado
- `divisionName(tier)` (domain/divisions.js) en el inicio y en la tabla.
- La gala lee el puesto de la tabla y muestra el premio, y si asciende (+80%) o no (+10%) de masa salarial.

## 4. Alcance
Incluido: helper, dos pantallas y la gala, tests (premio paritario con la escala de la base).
No incluido: ascensos reales entre divisiones (tarea A1 del roadmap).

## 5. Criterios de aceptación
- [x] AC-01: el nombre sale de la categoría del club.
- [x] AC-02: el premio mostrado coincide con `getPrizeForPosition`.
- [x] AC-03: ascenso +80% solo para los dos primeros, el resto +10%.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/ui-season-details.yml`
