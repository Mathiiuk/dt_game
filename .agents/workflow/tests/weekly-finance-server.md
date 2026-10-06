# Test Plan — weekly-finance-server

## 1. Objetivo
Probar que el cierre semanal lo resuelve la base, con los mismos importes que la economía del dominio, sin cobros dobles y sin importes del navegador.

## 2. Riesgos a validar
- Diferencias entre `weeklyBudget` (JS) y `close_week_finances` (SQL).
- Cobro doble en la misma semana.
- Un club ajeno cerrando una semana.

## 3. Unit tests
- [ ] Paridad: para varias combinaciones de reputación, niveles y planteles, `weeklyBudget` da los importes que la base devuelve (valores fijos comparados con una prueba en la base real).
- [ ] `financesApi.processWeek` llama a `close_week_finances` con club, temporada y semana, y no manda importes.
- [ ] Devuelve `{ income, expenses, newBudget, boardAid }` aunque el cierre ya estuviera hecho.

## 4. Integration tests
- [ ] En la base real, con retroceso: cierre normal (asientos y caja), pretemporada (aporte), repetido (sin asientos nuevos), club ajeno (rechazado).

## 5. E2E tests
- [ ] Con la cuenta real: avanzar una semana y comparar el libro mayor con la caja.

## 6. Regression tests
- [ ] La cascada semanal (`weekCascade.test.js`) sigue funcionando con la finanza mockeada.
- [ ] La pretemporada sigue sumando el aporte (`preseasonWeek.test.js`).

## 7. Security checks
- [ ] La función es `SECURITY INVOKER` y exige `manager_id` no nulo.
- [ ] No acepta importes del cliente.

## 8. Smoke tests
- [ ] Avanzar una semana en el navegador sin errores de consola nuevos.
