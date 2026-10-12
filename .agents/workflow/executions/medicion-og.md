# 2.0 Fase 0 · Medición y OG

- Eventos nuevos (sin datos personales) en `src/lib/analytics.js`: `invite_shared` (invitar a la sala; `placement`: share/copy), `ranking_opt_in` (activar la tabla pública), `match_played` (partido procesado; el primero = primer partido en GTM).
- Imágenes `public/og/*.webp` y `public/vestuario-og-home.webp` regeneradas con la estética de diario claro (`scripts/og-images.mjs`).
- Pendiente del usuario: crear en GTM los activadores/etiquetas GA4 para estos eventos y dar de alta el sitio en Search Console (el sitemap ya existe).
