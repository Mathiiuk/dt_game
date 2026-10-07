# Plan — event-single-choice
1. Reclamo atómico del evento en `resolveEvent` antes de aplicar efectos; liberar si falla la caja.
2. Bloquear todas las opciones de la tarjeta al elegir una.
3. Test de regresión con dos llamadas en paralelo.
