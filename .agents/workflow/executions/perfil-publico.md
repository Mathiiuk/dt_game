# 2.0 Fase 4 · Perfil público y ranking global

- BD (aditiva, aplicada en producción y probada con rollback): `managers.public_slug` (índice único parcial), `claim_public_slug()` (solo `authenticated`, solo con consentimiento), `public_manager_profile(p_slug)` (anon; nombre, puntos, títulos, victorias, puesto desde los 10 partidos y colores de camiseta; sin club ni ids) y `public_top_managers_v3` (agrega la dirección del perfil; la v2 queda). `scripts/db/migration_public_profile.sql`.
- Cliente: `src/lib/publicProfile.js`, ruta pública `/dt/:slug` (`PublicProfilePage`, noindex, con rewrite en `vercel.json`), nombres de la tabla enlazados al perfil (las leyendas no), tarjeta de Privacidad con "Ver mi perfil público" y "Tu puesto".
- Decisión: el perfil no se indexa en buscadores (el consentimiento cubre la tabla, no el posicionamiento de una página por persona); el JSON-LD/SEO queda fuera.
- Privacidad: política actualizada (página propia, sin indexar, desaparece al retirar el consentimiento).
