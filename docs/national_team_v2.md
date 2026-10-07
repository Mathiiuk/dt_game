# Mejoras en la Selección Nacional (National Team v2)

Este documento esboza las mejoras sugeridas para la ruta `/national-team`, que actualmente actúa como un objetivo de "Endgame" o estado avanzado de la carrera, pero carece de interactividad temprana.

## 1. Qué hay hoy

Actualmente, `/national-team` es una pantalla estática en las primeras temporadas. Solo muestra los requisitos casi inalcanzables para ser considerado (ej. ganar copas internacionales, reputación altísima) y el estado actual de la selección. No hay interacción para un DT novato.

## 2. Propuesta de Pantalla

La idea es darle vida a esta sección mucho antes de que el jugador sea candidato a dirigirla.

### 2.1 El Radar de la Selección (Scouting Nacional)

- **Seguimiento de Jugadores Propios:** Si tenés a la estrella joven del torneo, la pantalla de la Selección te avisa: *"El cuerpo técnico nacional está siguiendo de cerca a [Tu Jugador]"*. 
- Si tu jugador es convocado, el club recibe un plus temporal de moral, un ingreso extra por cesión y mejora la reputación del DT.

### 2.2 Rumores y Oportunidades (Interinato o Juveniles)

- **Selecciones Menores (Sub-20 / Sub-23):** Antes de ofrecerte la Mayor, a partir de tu 2da o 3ra temporada exitosa, puede aparecer la oferta para dirigir temporalmente un torneo juvenil. Esto sirve de puente.

### 2.3 Rediseño Visual

- Moverse de un texto estático de "Requisitos" a una vista de "Progreso de Carrera" hacia el buzo de la selección.
- Mostrar una barra de progreso que compare tu reputación actual con la necesaria para el puesto.

## 3. Tareas Estimadas (Esfuerzo S)

1. **Dashboard de Progreso:** Cambiar la lista plana de requisitos por barras de progreso visuales.
2. **Notificaciones de Convocatoria:** Integrar en el GameLoop que, durante fechas FIFA (si se implementan) o fines de temporada, los mejores jugadores del torneo sean "convocados", reflejándolo en esta pantalla.

## 4. Criterio de Aprobación

Al aprobar este documento, se planificará esta pequeña refactorización para darle utilidad a la pestaña de Selección durante las primeras 3 temporadas del juego.
