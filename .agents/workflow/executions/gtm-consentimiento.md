# Lanzamiento, fase 1: Google Tag Manager, consentimiento y eventos

- Roles: director-tecnico (plan en docs/plan-lanzamiento.md), frontend-engineer (banner y eventos), seo-growth-expert (medición), security-guardian (consentimiento y datos personales), qa-engineer (TDD).
- `index.html`: Consent Mode v2 en "denegado" ANTES de cargar GTM-NC5G56KV, reaplicando lo aceptado desde `localStorage`; snippet de GTM en el head y noscript al abrir el body. Verificado en `dist/index.html` tras el build.
- `src/lib/consent.js` y `CookieBanner` (Aceptar / Solo necesarias, enlace a Privacidad), montado una vez en `App.jsx`.
- Eventos nuevos sin datos personales: sign_up, club_created, season_closed, assembly_voted, friend_room_created, friend_room_joined.
- Privacidad: sección de cookies y Google Tag Manager.
- Gates: `npm run lint` (sin warnings, como el CI), 1858 tests, 70 escenarios BDD y build en verde.
- Pendiente del usuario en Google: etiqueta GA4 en el contenedor con los ajustes de consentimiento, activadores por evento, Search Console y publicar el contenedor.
