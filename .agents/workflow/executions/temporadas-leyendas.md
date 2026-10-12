# 2.0 Fase 6 · Camino a la leyenda (alcance ajustado)

- Revisión del alcance: las ventanas de mercado de verano e invierno (`api/calendar.js`, `api/market.js`) y la Copa Mundial en la liga de amigos y la selección ya existían, así que no se duplicaron.
- Nuevo: escenario "Camino a la leyenda". `legend_road()` (solo lectura, solo de uno mismo, misma fórmula que la tabla pública; aplicada en producción) devuelve mis puntos y las leyendas de `legend_managers`. `domain/legendRoad.js` calcula la próxima leyenda, lo que falta y el avance; `LegendRoadCard` en Carrera del DT (oculta si falla) con barras de avance accesibles y botón de compartir (`momentShare` kind `legend`).
- Sin cambios de formato en el navegador; BD aditiva (`scripts/db/migration_legend_road.sql`).
- Pendiente: sumar más leyendas a `legend_managers` solo con cifras de títulos verificadas (hoy las cinco salen de las fuentes citadas, con ±1–2 de diferencia); calendario de eventos especiales por temporada.
- Verificación con rollback de `legend_road` en producción: pendiente (la herramienta de base de datos pidió aprobación para consultas de prueba).
