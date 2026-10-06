# contracts-server

Renovaciones, primas de firma y rescisiones resueltas por el servidor.

- Base: `contract_demands` (pretensiones), `negotiate_renewal` (puntúa la propuesta, hasta 3 rondas, bloqueo de 4 semanas si se rompe, escribe contrato y descuenta la prima en una transacción) y `terminate_contract` (finiquito = 65% de los sueldos hasta el vencimiento). Probadas en la base real con retroceso.
- Fórmula única en `src/domain/contractDemands.js`; los tests la comparan con valores de la base.
- **Errores del código anterior que se corrigieron:**
  - Las pretensiones leían el ritmo del jugador como si fuera su media y pedían ~5 veces el sueldo real (un 56 pedía ~$660 contra ~$115): ahora usan la media y la escala de los planteles.
  - El finiquito usaba una columna que no existe (`contract_end_week`) y siempre calculaba 26 semanas: ahora sale del vencimiento y la fecha de juego.
  - `players.club_id` era NOT NULL, así que la rescisión (`club_id: null`) fallaba sin avisar y el club igual pagaba el finiquito: se permite club nulo (jugador libre, que es lo que el mercado ya esperaba).
  - La pantalla mandaba `club.current_week`, que no existe (siempre 1): el bloqueo de 4 semanas no se vencía nunca. Ahora se usa la semana absoluta de la fecha de juego.
- Se eliminó `renewContract` (escribía cualquier término desde el navegador y no se usaba).
- Pendiente: la comisión del representante (`agentsApi.disburseCommission`) sigue moviendo plata desde el navegador.
