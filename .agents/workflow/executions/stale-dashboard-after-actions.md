# stale-dashboard-after-actions

Hallazgos de la prueba con la cuenta real:

- **Decisión resuelta y la tarjeta seguía a la vista:** el inicio solo recargaba sus datos cuando cambiaban la caja o la fecha; una decisión sin costo (como el capítulo de una historia) dejaba todo igual y la lista de eventos, el clima y la bitácora quedaban viejos hasta recargar la página. Ahora resolver una decisión recarga el tablero (`reloadTick`).
- **Caja vieja al volver de un partido:** la taquilla (+$9.000) estaba en la base pero el inicio mostraba la caja de antes. El resumen del partido ahora refresca el contexto del club al procesar el resultado.
- **Texto engañoso en la negociación:** decía "contrato de 3 años" aunque la base firma los años que pide el jugador (mínimo 2): ahora muestra los reales.
