# Specification — player-loans

## 1. Objetivo
Línea de contenido "Mercado": cesiones a préstamo.

## 2. Cambio
- Migración `migration_player_loans.sql` (aplicada): columna `players.loan_from_club_id`, `loan_out_player` (sortea como receptor a un club de IA de tu liga, máximo 3 cedidos a la vez y plantel de 16 como mínimo, no permite ceder jugadores ajenos ni ya cedidos) y `return_loans`.
- `loansApi` (loanOut, returnLoans, getLoans con el ahorro semanal) y la gala llama a `return_loans` antes de la evolución y de liberar contratos vencidos.
- Plantel: acción "Ceder a préstamo" con confirmación y una sección "A préstamo" con los cedidos, el club donde están y lo que se ahorra por semana.
- El cedido sale del plantel, así que su sueldo sale de la masa salarial sin tocar el cálculo de finanzas.

## 4. Límites
No incluido: recuperar a un cedido antes del cierre ni ceder a clubes del usuario. Los cedidos no aportan nada deportivo mientras están afuera.

## 5. Criterios de aceptación
- [x] AC-01: reglas probadas en la base real (ajeno rechazado, repetido, máximo de 3, plantel mínimo, vuelta de los 3).
- [x] AC-02: el cierre de temporada los devuelve antes de liberar contratos.
- [x] AC-03: la pantalla confirma, avisa el ahorro y lista a los cedidos.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/player-loans.yml`
