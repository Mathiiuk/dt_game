# Specification — job-negotiation

## 1. Objetivo
Línea de contenido "Carrera del DT": ofertas de otros clubes con negociación real (como la de los jugadores).

## 2. Cambio
- `negotiateJob` (domain/jobNegotiation.js): pedís un sueldo semanal mayor y el club responde según tu ventaja de reputación sobre lo que exige el puesto: acepta hasta un margen de 5% (sin ventaja) a 30% (20 puntos o más), contraofertea con su máximo si te pasás hasta 15 puntos, y retira la oferta si el pedido es desmedido. Segunda ronda: acepta un pedido mínimo (hasta 3%) o queda firme. Máximo 2 rondas.
- `careerApi.negotiateJobOffer`: cuenta las rondas en la propia oferta (columna `negotiation_rounds`, migración aplicada), actualiza el sueldo ofrecido y marca la oferta como vencida si la retiran.
- `JobOfferBottomSheet` y la pantalla de Carrera: bloque "Negociar el sueldo" con el pedido, la respuesta del club y las rondas usadas.
- La selección nacional ya tenía pantalla propia ("Selección nacional y doble carrera"), así que no se tocó.

## 5. Criterios de aceptación
- [x] AC-01: respuestas ACCEPTED, COUNTER, WITHDRAWN, INVALID, FINAL y CLOSED según el pedido, la reputación y la ronda.
- [x] AC-02: reabrir la pantalla no permite negociar de nuevo (las rondas se guardan en la oferta).
- [x] AC-03: una oferta ajena o inexistente se rechaza.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/job-negotiation.yml`
