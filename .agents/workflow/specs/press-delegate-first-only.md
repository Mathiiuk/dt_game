# Specification — press-delegate-first-only (B15 de docs/roadmap_v2.md)

## 1. Objetivo
En la rueda de prensa, "No presentarme" y "Delegar en 2º entrenador" son decisiones de antes de hablar. Antes se podían usar después de contestar: delegar pisaba las respuestas ya dadas y sumaba +1 de moral encima de los efectos ya aplicados.

## 3. Cambio
- `PressRoom.jsx`: los dos botones solo se muestran si no hay ninguna pregunta contestada; después aparece "Terminar acá". El resumen final lista solo lo contestado.
- `pressApi.delegateToAssistant`: si ya hay una respuesta no hace nada (`alreadyAnswered`); cierra la conferencia solo si sigue abierta (dos clics no suman la moral dos veces); escribe las respuestas del ayudante en una sola consulta en vez de una por pregunta.
- `pressApi.finishEarly`: cierra la conferencia conservando lo respondido, sin multa ni efectos nuevos.
- `PostMatchScreen.jsx`: salir de la pantalla con respuestas dadas termina la conferencia ahí (antes contaba como no presentarse, con multa); una conferencia ya cerrada no se retoma al volver.
- Sin migración.

## 5. Criterios de aceptación
- [x] AC-01: sin respuestas se puede faltar o delegar.
- [x] AC-02: con una respuesta dada no se puede faltar ni delegar; hay "Terminar acá".
- [x] AC-03: delegar con respuestas dadas no pisa nada ni suma moral.
- [x] AC-04: terminar antes conserva las respuestas y no aplica efectos.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/press-delegate-first-only.yml`
