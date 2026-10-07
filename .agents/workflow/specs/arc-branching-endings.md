# Specification — arc-branching-endings

## 1. Objetivo
Línea de contenido "Historias": que el final cambie según el camino elegido y según la barra o la dirigencia (antes cada historia era lineal y el final dependía solo de la última opción).

## 2. Cambio
- `endingFor(option, flags, ctx)` y `closingTail(ctx)` en `domain/arcs.js`: la opción final puede traer `variants: [{ if: 'MARCA', ending }]` (gana la primera marca del camino que coincida) y, para todas las historias, una frase de cierre según el estado del club: barra en apretando o invadiendo, dirigencia por el piso (30 o menos) o por las nubes (75 o más), o tres favores aceptados.
- `resolveChapter` recibe el contexto y guarda el final ya armado; `climate.onArcChapterResolved` lee la barra, la confianza de la dirigencia y los favores.
- Variantes cargadas en 5 historias (el pibe, el arquero, la mano, el asado y el hincha): 24 finales alternativos. Agregar más es solo datos.

## 5. Criterios de aceptación
- [x] AC-01: una marca del camino cambia el final; sin marca coincidente queda el base.
- [x] AC-02: la frase de cierre respeta la prioridad barra > dirigencia > favores y no aparece con el club tranquilo.
- [x] AC-03: las variantes del catálogo apuntan a marcas que existen en capítulos anteriores.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/arc-branching-endings.yml`
