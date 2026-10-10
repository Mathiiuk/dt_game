# Plan de lanzamiento: Vestuario listo para tráfico y publicidad

## Context
El juego ya tiene todo el contenido (temporadas, ligas, Asamblea, liga de amigos), pero antes de atraer jugadores con SEO y anuncios hay que cerrar cuatro frentes que hoy bloquean: **medición** (el usuario aporta Google Tag Manager `GTM-NC5G56KV`), **SEO técnico** (dirección duplicada y páginas internas sin HTML propio), **legal** (sin correo de contacto y con un texto que contradice al juego) y **confiabilidad** (sin aviso de errores, economía por balancear). El sitio ya está en línea en Vercel (`vestuario.com.ar` redirige a `www.vestuario.com.ar`) con portada prerenderizada, `robots.txt`, `sitemap.xml`, JSON-LD y datos estructurados; `track()` de `src/lib/analytics.js` ya escribe en `window.dataLayer`.

Hallazgos de la revisión (solo lectura):
- `src/data/site.js` y todas las señales SEO usan `https://vestuario.com.ar` pero el sitio responde en `https://www.vestuario.com.ar/` (308): canonical y sitemap contradicen al host real.
- Las rutas públicas (`/como-jugar`, `/tacticas`…) devuelven el HTML de la portada (título y h1 de la home) hasta que corre JavaScript (`index.html` borra el prerender si `pathname !== '/'`).
- `contactEmail: null` en `site.js`: Contacto, Soporte y el derecho a eliminar datos de la Privacidad dicen que no hay canal.
- Términos: "Los clubes, jugadores y resultados… son ficticios", pero los clubes llevan nombres reales (`HISTORICAL_CLUBS_BY_TIER`).
- Privacidad habla de "eventos de uso" pero no de cookies ni de Google/GTM; no hay aviso de consentimiento.
- No hay monitoreo de errores; Supabase Auth con protección de contraseñas filtradas desactivada; economía: un club llegó a −$35.750.
- Rutas desconocidas redirigen a `/auth` (sin página 404 indexable). `lastmod` ausente en el sitemap.

## Fase 1 — Medición (GTM) · Claude
1. `index.html`: snippet de GTM (`GTM-NC5G56KV`) lo más arriba posible del `<head>` y el `<noscript>` justo después de `<body>`. **Antes del snippet**, `dataLayer.push` de Consent Mode v2 en `denied` (`ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`).
2. Banner de cookies mínimo (`src/features/consent/CookieBanner.jsx` + `src/lib/consent.js`): "Aceptar / Solo necesarias"; guarda la elección en `localStorage` (con try/catch) y empuja `consent update` al `dataLayer`. Solo se muestra en el sitio público y la primera vez.
3. `src/lib/analytics.js`: ampliar eventos con claves seguras (sin datos personales): `sign_up`, `club_created`, `first_match_played`, `season_closed`, `assembly_voted`, `friend_room_created`, `friend_room_joined`, `pwa_installed`. Instrumentar en los puntos correspondientes (AuthScreen, CreateClubWizard, MatchScreen post, SeasonCloseModal, AssemblyCard, FriendsScreen). Tests en `tests/` junto a los de `analytics`.
4. Actualizar `tests/static/homeSeo.test.jsx` para exigir GTM y que el prerender de la home se regenere (`HOME_PRERENDER=write`).
5. Privacidad: agregar sección de cookies y medición con Google Tag Manager/Analytics (qué eventos, sin nombre ni correo, cómo rechazar).

**Lo que debe hacer el usuario en GTM/Google:** crear la etiqueta GA4 (ID de medición) con activador "Todas las páginas" y las etiquetas de eventos; configurar los ajustes de consentimiento de las etiquetas; crear la propiedad de Search Console (verificación por registro DNS TXT) y enviar `sitemap.xml`; vincular GA4 con Search Console; publicar el contenedor en GTM.

## Fase 2 — SEO técnico · Claude
1. **Host canónico**: cambiar `SITE.url` a `https://www.vestuario.com.ar` (coincide con la redirección actual, sin tocar Vercel); alinear `index.html` (canonical, og:url, og:image), `sitemap.xml`, JSON-LD y `homeSeo.js`; los tests que fijan el dominio se actualizan. Si el usuario prefiere el dominio sin `www`, se invierte la redirección en Vercel y se mantiene el código actual.
2. **HTML propio por página pública**: plugin de Vite (`closeBundle`) o script post-build que, por cada `PUBLIC_PAGES` (`src/data/publicPages.js`), genera `dist/<ruta>/index.html` con título, descripción, canonical, Open Graph, JSON-LD y el contenido (h1, intro, secciones) en el HTML. Reutiliza `getPublicPage` y `src/seo/structuredData.js`. El script inline de `index.html` solo borra el prerender de la home. Vercel sirve el archivo estático antes del `rewrite`.
3. `sitemap.xml` con `<lastmod>`; generado desde `PUBLIC_PATHS` en el build para que no se desincronice; test que compara.
4. Página 404 real (`noindex`) en lugar del redirect a `/auth` para rutas inexistentes públicas; `robots.txt` ya bloquea `/friends` y las rutas privadas.
5. Datos estructurados: `FAQPage` en `/faq`, `BreadcrumbList` en páginas internas, `VideoGame` con `offers` gratis y `screenshot`.
6. Imagen OG por página (mínimo: una general y una de "Cómo jugar"); `alt` en imágenes y revisión de encabezados (un solo h1).
7. Rendimiento: medir Lighthouse (móvil) de portada y registro; objetivos LCP < 2,5 s, CLS < 0,1; revisar tamaño de los chunks (`manualChunks`), fuentes y precarga.

## Fase 3 — Contenido para tráfico orgánico · Claude (con aprobación del texto)
- 6 a 8 páginas de guía con intención de búsqueda real (en rioplatense, sin inventar datos): "juego de director técnico online", "simulador de fútbol argentino", "cómo armar una táctica 4-4-2", "cómo fichar jugadores en un juego de DT", "cantera y juveniles", "liga con amigos". Cada una con h1 único, 400–700 palabras, enlaces internos, CTA a `/registro` y FAQ.
- Enlace de invitación para la liga de amigos (`/friends?code=XXXX`) y botón "Compartir" (Web Share API): es la vía de crecimiento más barata.

## Fase 4 — Legal y confianza · Claude redacta, el usuario decide
1. **Correo de contacto**: el usuario elige una casilla (p. ej. `contacto@…`); se carga en `SITE.contactEmail` y se actualizan Contacto, Soporte y Privacidad. Bloqueante para publicidad.
2. **Términos**: corregir "ficticios": los nombres de clubes son reales y los jugadores, inventados; agregar descargo "sin afiliación con ninguna liga, club ni federación", reglas de la liga de amigos (mote de lista cerrada, travesuras solo en el juego), edad mínima, suspensión de cuentas, limitación de responsabilidad.
3. **Privacidad**: datos de Supabase (Argentina/EE. UU. según región), Vercel, GTM/GA4, retención, derechos de acceso/supresión (ya existe borrar cuenta), contacto. Mencionar la Ley 25.326 y el registro ante la AAIP; **consultar a un abogado** sobre el uso de nombres de clubes en publicidad y el registro de la base de datos.
4. Tests estáticos que impidan publicar con `contactEmail: null` (build falla) y con "ficticios" en Términos.

## Fase 5 — Confiabilidad y seguridad · Claude + usuario
1. **Sentry** (o equivalente) en el cliente: `@sentry/react` con `VITE_SENTRY_DSN`, sin datos personales, solo producción; boundary de errores con mensaje amable. El usuario crea el proyecto y entrega el DSN.
2. Supabase: correr los *advisors* de seguridad y rendimiento; índices faltantes de las tablas nuevas (`friend_*`, `season_rule_votes`, `real_squads`); revisar RLS de las tablas nuevas; **usuario** activa "Leaked password protection" en Auth y revisa el plan (copias de seguridad/PITR, límites de conexiones y egress ante tráfico).
3. Límites de abuso: reCAPTCHA en registro (ya existe la variable), límite de salas por usuario y de travesuras por día (ya hay 3).
4. Prueba de carga ligera de los RPC más usados (`play_league_ai_fixtures`, `finish_user_fixture`, `friend_league_table`) con 50 sesiones simuladas; vigilar tiempos > 60 s en DDL/RPC.
5. Limpiar datos de prueba: clubes sin DT de usuarios reales se dejan; usuarios de simulación (`sim-test%`) borrados.

## Fase 6 — Calidad de juego y retención · Claude + 3 a 5 testers
1. Recorrido de la primera hora con una cuenta nueva y alguien que no conozca el juego: registro → crear DT → club → primer partido → primera semana; anotar fricción.
2. **Economía**: corregir el balance para que un club nuevo no entre en caja negativa en la primera temporada (simulación anual con `SIM=1`, ver `tests/sim/yearSim.test.js`); test de regresión.
3. Simulación anual completa con la Asamblea (voto → cierre → año 2) y una sala de amigos con 3 cuentas.
4. QA en móviles reales (iOS Safari, Chrome Android), instalación de la PWA y modo sin conexión.
5. Accesibilidad: foco, contraste (WCAG AA), etiquetas; ya hay buena base del sistema de diseño.
6. Objetivos de retención a medir con GTM: D1 ≥ 25 %, D7 ≥ 10 %, 1 temporada completa ≥ 30 % de los registrados.

## Fase 7 — Publicidad (después de las fases 1–5)
- Landing de campaña: `/registro` con UTM conservados hasta el evento `sign_up`; conversiones en GA4/Google Ads/Meta.
- Prueba chica y medida: USD 5–10 por día, 2 audiencias (fanáticos de Football Manager / fútbol argentino), 3 creatividades (capturas de la liga de amigos, la Asamblea bizarra, el mercado); decidir con costo por registro y retención D1, no con clics.
- Calendario: ventana de lanzamiento (inicio de torneo/Mundial), publicaciones en comunidades de fútbol y de juegos, microinfluencers; no gastar hasta superar la fase 6.

## Orden y ramas (TDD, `npx eslint src tests`, `npm test`, `npm run test:bdd`)
1. `feat/gtm-consentimiento` (fase 1) — se puede entregar ya.
2. `feat/seo-tecnico` (fase 2) y `feat/guias-seo` (fase 3).
3. `fix/legal-contacto` (fase 4, depende del correo).
4. `feat/monitoreo-errores` y `fix/economia-inicial` (fases 5–6).
Cada rama: reporte en `.agents/workflow/executions/`, CI y auto-merge.

## Verificación
- Local: tests nuevos (consentimiento, eventos, prerender por ruta, sitemap/`SITE.url`, legal sin `null`), build limpio, `dist/como-jugar/index.html` con su título y h1.
- Producción: `curl -sL https://www.vestuario.com.ar/como-jugar` devuelve el título/h1 propios; `view-source` con GTM; Tag Assistant de GTM en modo vista previa (eventos `sign_up`, `club_created`); Rich Results Test y PageSpeed Insights; Search Console sin errores de cobertura y sitemap aceptado.
- Antes de publicidad: lista de chequeo de las fases 1–6 en verde y confirmación del usuario.
