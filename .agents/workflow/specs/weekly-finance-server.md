# Specification — weekly-finance-server

## 1. Objetivo
Que el cierre económico de cada semana (ingresos recurrentes, sueldos, mantenimiento y aporte de la dirigencia en pretemporada) lo calcule y escriba el servidor, no el navegador.

## 2. Problema actual
`financesApi.processWeek` lee el club, los jugadores y el cuerpo técnico, calcula los importes en el navegador y escribe el libro mayor y la caja (`clubs.budget`) con montos que el propio navegador decidió. Además no es idempotente: si el cierre se repite para la misma semana, cobra dos veces.

## 3. Resultado esperado
- Una función SQL `close_week_finances` que lee los datos desde la base, aplica la misma economía que `domain/finances.js`, escribe un asiento por concepto y actualiza la caja en una sola transacción.
- Idempotente por club, temporada y semana.
- El cliente solo pide el cierre y recibe `{ income, expenses, newBudget, boardAid }`.

## 4. Alcance
### Incluido
- Migración con la función y sus pruebas en la base real (con retroceso).
- `financesApi.processWeek` pasa a llamar a la función.
- Tests de paridad entre la fórmula de `domain/finances.js` y la de la base.

### No incluido
- Costos de decisiones, mejoras del estadio, entrenamiento y premios de temporada (siguientes etapas).
- Bloquear la escritura directa de `clubs.budget`: todavía hay otros flujos del navegador que la usan.

## 5. Criterios de aceptación
- [ ] AC-01: el cierre semanal escribe los asientos MEMBERS, SPONSOR, TV, STORE, SALARY, STAFF, MAINTENANCE (y BOARD_AID en pretemporada) y la caja con los mismos importes que calcula `weeklyBudget`.
- [ ] AC-02: repetir el cierre de la misma semana no cobra de nuevo.
- [ ] AC-03: el navegador no manda ningún importe.
- [ ] AC-04: solo el club del usuario puede cerrar su semana.

## 6. Restricciones
Función `SECURITY INVOKER` (respeta la seguridad por cuenta); fórmula duplicada en JS con tests de paridad; sin cambiar los importes que ve el jugador.

## 7. Dependencias
Aporte de la pretemporada (`preseason.js`), seguridad por cuenta aplicada.

## 8. Riesgos
- Que la fórmula de SQL y la de JS se separen: se cubre con valores fijos en tests.
- Que dos pestañas cierren la misma semana: la idempotencia lo evita.

## 9. Impacto
### Frontend
`financesApi.processWeek` (misma firma de retorno).
### Backend
Nueva función `close_week_finances`.
### Database
Sin tablas nuevas.
### Infraestructura
Ninguna.
### Seguridad
Quita al navegador la decisión de cuánto se cobra y se paga cada semana.

## 10. Preguntas / incertidumbres
Ninguna: es una traslación de lo que ya existe.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/weekly-finance-server.yml`
