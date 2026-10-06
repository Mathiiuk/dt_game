# market-agents

Mercado 2.0, etapa 4: representantes y pedidos de salida.

- **Comisión en el servidor:** `agent_commission_rate` (base del carácter: codicioso 12%, hostil 10%, razonable 8%, protector 5%, ajustada por la relación con el DT entre 4% y 15%; sin representante 8%). `negotiate_transfer` cobra la comisión del precio y `negotiate_renewal` cuatro semanas de sueldo, en la misma transacción que el fichaje o el contrato y con el control de caja. Probado en la base real con retroceso: relación 0 = 14,4%, relación 100 = 9,6%; fichaje de $6.384 con $919 de comisión.
- **Pedido de salida con ruido:** al llegar una oferta por uno de tus jugadores, su representante puede hacer lío (hostil 70%, codicioso 55%, razonable 25%, protector 15%, sin representante 20%; máximo 3 eventos pendientes y uno por jugador). El evento ofrece escuchar, mejorarle el contrato (+15% de sueldo) o plantarte (la hinchada aplaude, el jugador queda mal). `apply_player_drama` en la base aplica el aumento o el malestar.
- Cliente: `agentsApi.disburseCommission` desapareció (movía plata desde el navegador); el modal de oferta y el de renovación muestran la comisión que cobró la base.
- Con esto el mercado completo (fichajes, ventas, renovaciones, rescisiones, cuotas y comisiones) mueve la plata en el servidor.
