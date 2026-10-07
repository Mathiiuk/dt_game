# Specification — lint-warnings-cleanup-2

## 1. Objetivo
Bajar el tope de avisos de ESLint de 46 a 13.

## 2. Cambio
Se quitaron los 33 avisos de código muerto: declaraciones con valor inicial que siempre se pisaba (`let x = 0` que se reasigna en todas las ramas pasa a `let x`), parámetros sin uso (ahora con prefijo `_`, sin cambiar las llamadas posicionales), imports sin uso y un comentario de ESLint innecesario. Sin cambios de comportamiento: la suite completa (1.230 tests) sigue igual.

## 3. Lo que queda (13 avisos)
Todos son `react-hooks/exhaustive-deps` (dependencias de efectos). No se tocan a ciegas porque agregar una dependencia cambia cuándo corre el efecto y puede disparar cargas repetidas; cada uno requiere verificarlo en pantalla.

## 5. Criterios de aceptación
- [x] AC-01: 0 errores y 13 avisos.
- [x] AC-02: suite sin cambios.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/lint-warnings-cleanup-2.yml`
