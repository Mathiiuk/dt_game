# 2.0 Fase 2 · Partido vivo

- Dominio `src/domain/livePitch.js` (`pitchState`): de las jugadas del relato sale la posición de la pelota (remates hacia el arco que ataca, córner desde la esquina, penal desde el punto, circulación estable por el medio), el gol reciente y la tarjeta; determinista (sin azar) y tolerante a datos raros.
- Componente `src/features/match/LivePitch.jsx`: tira de cancha SVG liviana (decorativa, `aria-hidden`), pelota con una sola transición, cartel "¡GOL!" (`pop-in`, uno por gol), tarjetas, banco que festeja (`bench-cheer`). Colores de los equipos desde los clubes.
- Integrado en `MatchScreen` sobre el relato; no cambia reglas ni `markBusy`. "Menos movimiento" ya reduce las animaciones (regla global).
- Verificado con capturas en Chromium (remate, gol, roja + córner, circulación).
- Rendimiento: ~20 nodos SVG y una transición por jugada; sin timers propios (se mueve con el minuto que ya avanza el partido).
