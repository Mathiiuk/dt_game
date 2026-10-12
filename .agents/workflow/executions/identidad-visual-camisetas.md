# 2.0 Fase 1 · Camisetas con diseños

- Dominio `src/domain/jerseyKits.js` (6 diseños, normalización con valor por defecto) y componente compartido `Jersey` (estampado recortado a la silueta con `clipPath`, ids únicos).
- Asistente de fundación: selector de diseño con vista previa; `clubApi.createClub` guarda `jersey_pattern`.
- Club: tarjeta "Camiseta titular" para cambiar el diseño (`clubApi.updateClub`).
- BD (aditivo): `clubs.jersey_pattern text` nulo; los clubes existentes se ven como antes (franja central). Migración aplicada en producción: `scripts/db/migration_club_jersey_pattern.sql`.
- Pendiente de la fase: escudo y camiseta en tarjetas de compartir, retratos de jugadores, micro-animaciones.
