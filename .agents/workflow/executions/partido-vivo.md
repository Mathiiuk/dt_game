# 2.0 Fase 2 · Partido vivo

- Dominio `src/domain/livePitch.js` (`pitchState`): de las jugadas del relato sale la posición de la pelota (remates hacia el arco que ataca, córner desde la esquina, penal desde el punto, circulación estable por el medio), el gol reciente y la tarjeta; determinista (sin azar) y tolerante a datos raros.
- Componente `src/features/match/LivePitch.jsx`: tira de cancha SVG liviana (decorativa, `aria-hidden`), pelota con una sola transición, cartel "¡GOL!" (`pop-in`, uno por gol), tarjetas, banco que festeja (`bench-cheer`). Colores de los equipos desde los clubes.
- Integrado en `MatchScreen` sobre el relato; no cambia reglas ni `markBusy`. "Menos movimiento" ya reduce las animaciones (regla global).
- Verificado con capturas en Chromium (remate, gol, roja + córner, circulación).
- Rendimiento: ~20 nodos SVG y una transición por jugada; sin timers propios (se mueve con el minuto que ya avanza el partido).

## Seguimiento
- **Reacción al gol en contra:** el banco del equipo que recibió el gol se lamenta (`bench-lament`, `data-lament`); el que lo hizo festeja.
- **Prueba dentro de la pantalla real del partido** (`tests/ui/matchLivePitch.test.jsx`, con los datos de prueba de `matchDecisions`): sin cancha antes del pitazo; pelota, cartel de gol (y su apagado), bancos, roja y `aria-hidden` con el reloj del partido avanzando.
- **Prueba en navegador real** (`npm run test:e2e:cancha`, `scripts/e2e/`): partido simulado de 90 minutos en Chromium con el CSS de producción y la CPU 6x más lenta: 13/13 comprobaciones, 60 cuadros por segundo, 0 tareas largas. Mide el componente en un arnés, no la pantalla completa con sesión.
- Pendiente: probarla en un celular real.
