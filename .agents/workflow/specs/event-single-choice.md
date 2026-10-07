# Specification — event-single-choice (B1 de docs/roadmap_v2.md)

## 1. Objetivo
Un evento aleatorio aplica una sola opción. Antes, dos clics seguidos (o dos pestañas) podían aplicar dos opciones: doble movimiento de caja, moral y reputación.

## 2. Causa
- La tarjeta del Inicio bloqueaba solo el botón apretado; las otras opciones seguían activas.
- `eventsApi.resolveEvent` leía el estado al empezar y marcaba el evento como resuelto recién al final: dos llamadas pasaban las dos el control.

## 3. Cambio
- `src/api/events.js`: después de validar (opción, respaldo de la dirigencia, fondos) el evento se reclama en un solo paso (`update ... where status = 'PENDING'` devolviendo la fila). Si no se reclamó ninguna fila, devuelve `alreadyResolved` sin aplicar nada. Si la caja no se puede mover, el evento vuelve a quedar pendiente.
- `src/features/dashboard/Dashboard.jsx`: al elegir una opción se bloquean todas las de esa tarjeta; si el evento ya estaba resuelto no se muestra el cartel de éxito.
- Sin migración.

## 5. Criterios de aceptación
- [x] AC-01: dos opciones en paralelo aplican una sola (un movimiento de caja, un efecto de clima).
- [x] AC-02: un evento ya resuelto no vuelve a aplicar nada.
- [x] AC-03: si la caja falla, el evento queda pendiente y sin efectos aplicados.
- [x] AC-04: sin fondos para el costo, el evento no se reclama.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/event-single-choice.yml`
