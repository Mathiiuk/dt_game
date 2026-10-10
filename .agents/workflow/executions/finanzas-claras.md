# Finanzas claras: tope de sueldos y verificar balance

## Problema
El "$X / 3500" del inicio no decía qué era (masa salarial semanal contra el tope blando de la dirigencia), Finanzas no lo mostraba, y el inicio calculaba la nómina con otra columna (`contract_wage`) y sin el cuerpo técnico, distinta del cierre semanal. Además no había forma de controlar que la caja cuadre con el libro de movimientos.

## Cambios
- `src/domain/finances.js`: `DEFAULT_WAGE_CAP`, `wageCapOf`, `payroll` (jugadores `contract_salary` + staff, misma cuenta que el cierre), `wageCapStatus` (tono verde/ámbar/rojo, margen, cuánto se pasa), `WAGE_CAP_EXPLAINER` y `balanceCheck` (OK / diferencia / sin movimientos, con mensaje claro).
- `WageCapMeter.jsx`: "Masa salarial X / tope", barra con zonas, "Margen $X" o "Te pasás $X" y explicador "¿Qué es esto?". Se usa en el inicio y en Finanzas > Flujo semanal.
- `dashboard.js`: nómina con `payroll` (agrega la consulta de staff) y `wageCapOf`; `finances.js`: mismo tope y mismo fallback (3500) que el resto.
- `financesApi.verifyBalance(clubId)`: solo lectura; compara `clubs.budget` con el último `balance_after` del libro. Botón "Verificar balance" en la billetera, con el resultado explicado (los fichajes, premios y primas mueven la caja sin asiento, por eso una diferencia se explica y no se "corrige").
- Tests: `tests/domain/wageCap.test.js`, `tests/ui/wageCapMeter.test.jsx`, `tests/api/verifyBalance.test.js`, casos nuevos en `financesScreen.test.jsx` y `dashboardRank.test.js`.
