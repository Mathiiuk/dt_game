# renovacion-contrato

Renovar un contrato ahora lo extiende de verdad.

- **Antes:** `negotiate_renewal` calculaba el nuevo vencimiento desde el cierre de la temporada en curso (`año de la temporada + años - 1`). Con 1 año y la fecha en enero, el vencimiento quedaba en el 30/06 de este mismo año, igual al que ya tenía: el jugador "renovaba" (se cobraba la comisión y subía el sueldo) pero seguía en "contratos por vencer".
- **Ahora:** los años pedidos se suman al vencimiento que ya tiene, o al cierre de esta temporada si ya estaba vencido o sin fecha (`season_end`, `base_end`). En enero de 2027, un contrato que vence el 30/06/2027 renovado por 1 año pasa a vencer el 30/06/2028.
- **Aplicado en la base:** migración `renewal_extends_contract` (`scripts/db/migration_renewal_extends_contract.sql`). Se partió de la función que estaba desplegada, que además de la del repo tenía `set search_path` y `app.server_result`; ambos se conservan.
- **Probado en la base real con retroceso:** renovación de un jugador cuyo contrato vencía el 30/06/2027, por 1 año, con la fecha del juego en 10/02/2027: aceptada y vencimiento 30/06/2028 (73 semanas, fuera de la ventana de aviso); transacción deshecha. La tabla de casos de fechas (contrato vigente, ya vencido, sin fecha, 1 y 3 años) también da lo esperado.
- **No se repararon** los contratos que se renovaron antes con el bug (siguen con el vencimiento viejo y con el sueldo nuevo): hay que renovarlos otra vez.
- **TDD:** `tests/static/renewal-sql.test.js` protege la fórmula, las protecciones y la firma de la función.
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
