# 2.0 Fase 1 · Camisetas con diseños

- Dominio `src/domain/jerseyKits.js` (6 diseños, normalización con valor por defecto) y componente compartido `Jersey` (estampado recortado a la silueta con `clipPath`, ids únicos).
- Asistente de fundación: selector de diseño con vista previa; `clubApi.createClub` guarda `jersey_pattern`.
- Club: tarjeta "Camiseta titular" para cambiar el diseño (`clubApi.updateClub`).
- BD (aditivo): `clubs.jersey_pattern text` nulo; los clubes existentes se ven como antes (franja central). Migración aplicada en producción: `scripts/db/migration_club_jersey_pattern.sql`.
- Tarjetas de compartir: `src/lib/shareJersey.js` (`drawJersey`, `kitOf`) pinta la camiseta del club en el resultado y en los momentos (campeonato, ascenso, fichaje, año, reto); solo se dibuja si llega el kit.
- Retratos: `domain/playerPortrait.js` (rasgos estables por id o nombre, canas desde los 34) y `PlayerPortrait` (SVG decorativo, `aria-hidden`) en las tarjetas de Plantel (móvil) y Mercado.
- Micro-animaciones: tokens `stamp-in` y `pop-in` en `index.css` (sello "Fichado" al cerrar un pase, trofeo al salir campeones); la regla de "menos movimiento" ya las reduce.
- Fase 1 completa.
