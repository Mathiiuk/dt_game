# Specification — press-situations

## 1. Objetivo
Línea de contenido "Prensa": preguntas por situación (racha, clásico, ex jugador, fichaje) y preguntas que recuerden respuestas anteriores.

## 2. Cambio
- `domain/pressSituations.js`: `situationQuestion` (ex jugador del club en el rival, refuerzo de la temporada que fue la figura, racha de derrotas, de victorias o invicto largo, con ese orden de prioridad), `memoryQuestion` (tres respuestas seguidas del mismo tono: combativas, autocríticas o elogiosas, y el periodista se lo hace notar) y `toneHistory`.
- `pressApi.buildPressContext` junta las rachas, los traspasos de la temporada y el ex jugador del rival; `pressApi.toneMemory` lee las últimas conferencias.
- La conferencia sigue siendo corta: hasta 4 preguntas (análisis, figura y hasta 2 de clásico, situación o memoria). El clásico mantiene su pregunta de siempre.

## 5. Criterios de aceptación
- [x] AC-01: cada situación genera su pregunta con las 4 opciones de tono.
- [x] AC-02: la memoria solo salta con tres tonos iguales seguidos.
- [x] AC-03: nunca más de 4 preguntas; el clásico conserva la suya.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/press-situations.yml`
