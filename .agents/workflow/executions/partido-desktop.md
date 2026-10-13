# Partido en vivo 2.0 (escritorio)

Rama: `feat/partido-desktop`. Pedido: en desktop había botones repetidos del modo móvil (Pausa/velocidad/Cambios/Gritos/Saltear abajo); mejorar la dirección técnica, el modo de cambios y la visualización del partido en vivo.

## Qué cambió (solo ≥1024 px; el celular queda igual)
- `DirectionPanel`: control (pausa, x1/x2, saltear), órdenes desde el banco con su efecto y cooldown, y cambios disponibles en un solo panel.
- `DesktopSubstitutions`: diálogo de dos paneles (titulares por línea / suplentes ordenados por rendimiento en el puesto), pausa automática.
- `DesktopPitch`: cancha con proporción real, 22 jugadores según formación (`dotsFor`), corrimiento hacia la pelota, estela, cartel de gol y tarjetas.
- `MatchProgress`: línea de tiempo 0–90 con goles, tarjetas y cambios (`matchMarkers`).
- `MatchStats` con `alwaysOpen` en escritorio. Se quitó la botonera inferior y la columna vieja (`SubstitutionsPanel`) en desktop.

## Verificación
- Pruebas nuevas: `livePitch` (dotsFor/matchMarkers), `directionPanel`, `desktopSubstitutions`, `desktopPitch`, `matchDesktop` (integración con matchMedia ≥1024).
- Capturas Chromium 1908/1280/390 con `node scripts/e2e/match-shots.mjs <dir>`.
- Gates: lint, vitest, BDD y build (ver resultado en el commit).
- Sin cambios de base de datos.
