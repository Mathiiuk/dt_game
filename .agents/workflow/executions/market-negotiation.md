# market-negotiation

Mercado 2.0, etapa 2: negociación con contraofertas y cuotas, en el servidor.

- `negotiate_transfer` (base): el club vendedor responde ACEPTA / CONTRAOFERTA / RECHAZA. Hasta 2 rondas; la contraoferta de la 2ª es final; una oferta menor al 70% del precio pedido es una ofensa y cierra la mesa; mesa cerrada = no se vuelve a ofertar por ese jugador hasta la próxima ventana (verano o invierno). Un club con la caja flaca (<$8.000) afloja 5%. Si acepta, el fichaje se ejecuta en la misma transacción.
- `execute_transfer` quedó cerrada (solo se negocia), para que nadie se saltee las rondas pagando el mínimo directo.
- Cuotas: 40% hoy y dos cuotas semanales, +8% al precio. `settle_installments` cobra las vencidas en el cierre semanal (junto con el clima, antes de que la barra lea la caja); si la caja no alcanza, la cuota se atrasa con 10% de recargo (una vez) y la dirigencia lo anota (-2 por cuota atrasada).
- Tablas `transfer_negotiations` y `transfer_installments` (con dueño y política por cuenta). Probado en la base real con retroceso: rondas, cierre, rechazo del camino directo, 3 cuotas con vendedor acreditado y atraso con recargo.
- Cliente: `marketApi.negotiate` y `settleInstallments`; `OfferModal` muestra la respuesta del club, ronda 1 o 2 de 2, aceptar/mejorar/retirarse y el plan de cuotas.
- Pendiente (etapa 2b): ventas y renovaciones siguen moviendo la plata desde el navegador.
