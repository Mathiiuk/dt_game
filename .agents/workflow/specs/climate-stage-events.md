# Specification — climate-stage-events

## 1. Objetivo
Línea de contenido "Clima" del roadmap: que cada etapa de la barra y cada nivel de presión tengan eventos propios, y sumar combos.

## 2. Contenido
- 6 eventos de ambiente (`STAGE_EVENTS`): la canción de la popular (todo fluye y barra en calma), las entradas de favor en la reventa (barra pide), las pintadas en la pared (barra presiona), el pibe con miedo (barra aprieta o invade), el presidente en la radio (presión 60 o más) y la semana tranquila (presión 25 o menos). Cada uno con 2 o 3 opciones y su efecto.
- 3 combos nuevos: caja vacía y derrotas (círculo vicioso), ganan con la enfermería llena y plata en caja con buen momento.
- `events.generateWeeklyEvents` pasa la presión al sorteo y `climate.processWeek` pasa la caja a los combos.

## 5. Criterios de aceptación
- [x] AC-01: un evento de etapa solo aparece en su etapa (y los de presión, en su rango).
- [x] AC-02: los combos nuevos se disparan con la racha exacta y no se repiten.
- [x] AC-03: escenarios `@auto` ejecutables.

## Nota técnica
Cucumber corre en Node puro, que no resuelve imports sin extensión (`./consequences`): se agregó `tests/bdd/register.mjs` con un gancho de resolución, para poder probar cualquier módulo de `src/domain` sin cambiar el código de la app.

## 11. Trazabilidad
Manifest: `.agents/workflow/tasks/climate-stage-events.yml`
