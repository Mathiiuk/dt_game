# Ejecución: f3-p2-national-cup-screens

- NationalTeamScreen: bolsa de selecciones (elegibilidad por reputación, confirmación), vista activa con resumen de récord, pestañas de convocatoria (aviso de arqueros mínimos) y fechas FIFA; se retiró BottomNav y se agregó volver con PageHeader.
- InternationalCupScreen: llaves por fase con tarjetas, banner de campeón, estados vacíos por fase y sin torneo; sólo el partido propio pendiente es jugable.
- Observación (no cambiada): el resultado del partido de copa se genera con Math.random en el cliente; debería resolverse en backend (Fase 5).
- Verificado a 375 px sin desborde. 3 tests nuevos.
