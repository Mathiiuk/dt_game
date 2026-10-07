# Specification — contracts-countdown-alert

## 1. Objetivo
Que el DT se entere a tiempo de los contratos que se le vencen: al cerrar la temporada los que no renovaron quedan libres (la cuenta de prueba llegó a tener 1 jugador por no renovar).

## 2. Cambio
`contractsAlert(squad, gameDate)` (domain/contracts.js): aviso suave (prioridad baja) durante los 6 meses previos; en las últimas 12 semanas la alerta es de prioridad alta, cuenta cuántos jugadores quedan libres y en cuántas semanas. El inicio la usa en lugar del armado en línea.

## 5. Criterios de aceptación
- [x] AC-01: sin vencimientos en la ventana no hay alerta.
- [x] AC-02: a mitad de temporada es suave; en las últimas 12 semanas es urgente con la cuenta regresiva.
- [x] AC-03: los contratos de la temporada siguiente no disparan la urgencia.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/contracts-countdown-alert.yml`
