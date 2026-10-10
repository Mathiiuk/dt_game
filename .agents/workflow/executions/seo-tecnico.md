# SEO técnico: dirección única, HTML por página, contacto y términos

- Roles: seo-growth-expert (canonical, sitemap, prerender), frontend-engineer (build), qa-engineer (TDD), director-tecnico (legal con cuidado: sin asesoría jurídica).
- Dirección única: `SITE.url` pasa a `https://www.vestuario.com.ar` (la que ya responde; el dominio sin `www` redirige). Alineados `index.html`, `sitemap.xml`, `robots.txt` y los tests.
- Prerender al compilar (`npm run build` = `vite build && node scripts/prerender-public.mjs`): genera `dist/<ruta>/index.html` para las 11 páginas públicas con su título, descripción, canonical, Open Graph, JSON-LD de preguntas frecuentes y el texto de la página en el HTML (`src/seo/prerender.js` puro + `prerenderEntry.jsx` con el mismo componente `InfoPage`). `index.html` ya no borra lo prerenderizado (`data-prerendered`). Sitemap generado con `lastmod`.
- Contacto: `contacto@vestuario.com.ar` en Contacto, Soporte, Privacidad y Términos.
- Términos: se corrigió "ficticios": los jugadores son inventados y los clubes llevan nombres de instituciones solo para ambientar, sin relación ni patrocinio.
- Pendiente: el correo de las notificaciones de cuenta (`hola@`/`no-contestar@` en la función de correo) no se tocó; página 404 indexable; guías de contenido; abogado por nombres de clubes.
