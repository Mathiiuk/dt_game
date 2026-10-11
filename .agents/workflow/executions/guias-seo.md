# Guías de contenido, migas de pan e imágenes de vista previa

- Roles: seo-growth-expert (contenido, datos estructurados), product-designer (imágenes), qa-engineer (TDD).
- 9 páginas nuevas (hub `/guias` + 8 guías) en rioplatense, de 300 palabras o más, sin nombres de clubes reales (test que lo exige), con datos verdaderos del juego. Grupo "Guías" en el pie.
- `BreadcrumbList` en todas las páginas internas y `FAQPage` en `/faq` dentro de un mismo `@graph` (`pageStructuredData`, usado por la página y por el prerender).
- Imágenes: `scripts/og-images.mjs` (Chromium + Pillow) genera `public/og/<slug>.webp` de 1200x630 por página (menos de 150 KB); el prerender pone `og:image` propio por página.
- Gates: lint, tests y build.
- Pendiente: la demo `/demo` (rama siguiente) y el enlace desde la portada; redes sociales en `sameAs` cuando el usuario cree las cuentas.
