# weekly-finance-server

Cierre semanal de finanzas resuelto por el servidor.

- **Antes:** el navegador calculaba ingresos y gastos de la semana y escribía el libro mayor y la caja con montos propios; un cierre repetido cobraba dos veces.
- **Ahora:** `close_week_finances` (base, `SECURITY INVOKER`) lee club, plantel y cuerpo técnico, aplica la misma economía que `domain/finances.js`, escribe un asiento por concepto y actualiza la caja en una transacción. Idempotente por club, temporada y semana (la marca es el asiento de sueldos). Incluye el aporte de la dirigencia en pretemporada.
- **Probado en la base real con retroceso:** ingresos 1.150, gastos 2.964, aporte 1.302 (neto -512, igual que la fórmula de JS); cierre repetido sin asientos nuevos; semana de liga sin aporte; club inexistente o ajeno rechazado.
- **Cliente:** `financesApi.processWeek` solo pide el cierre (sin jugadores ni importes); la cascada semanal dejó de mandarle la lista de jugadores.
- **TDD:** tests escritos antes (rojo: 3 fallas de API) y luego la migración y el cliente (verde); la paridad de la economía queda fijada con valores de la base.
- **Quality gates:** `agt task:verify` pasa (unit_tests). `bdd_tests` queda desactivado en el manifiesto porque Cucumber no está instalado (ver memoria del proyecto).
- Spec, plan de pruebas y escenarios Gherkin completos en `.agents/workflow/`.
