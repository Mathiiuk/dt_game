# 2.0 Fase 3 · Compartir con portada de diario

- `src/lib/shareMatch.js`: tarjetas del resultado y de los momentos con formato de primera plana (filete doble, cabezal VESTUARIO / EL DIARIO DEL DT, titular en slab, marcador, club, camiseta, enlace). `cardPalette(theme)` usa los colores del juego: papel de diario (claro) o noche de redacción (oscuro); sin pedirlo sigue el tema activo (`data-theme`).
- Misma API: `drawShareCard`/`drawMomentCard` aceptan `theme` opcional; sin kit no se dibuja la camiseta.
- Privacidad: las tarjetas solo llevan marca, resultado, nombre del club propio y rival; sin correo ni datos de cuenta (hay prueba).
- Verificado con capturas del canvas real en Chromium (claro y oscuro, victoria/derrota/campeón).
- `og/` por página ya salieron con la estética de diario en la fase 0.
