# Estrategia de pruebas: home-landing

| Área | Archivo | Qué cubre |
|---|---|---|
| Frases (dominio) | `tests/domain/managerQuotes.test.js` | Integridad del dataset, regla de publicación, respaldo, no repetir, tiempos |
| Portada (UI) | `tests/ui/homeLanding.test.jsx` | H1 único, enlaces de encabezado, llamados y pie, estados de usuario, metadatos, eventos |
| Flash (UI) | `tests/ui/homeLanding.test.jsx` | Ciclo de estados, sólo aprobadas, respaldo, movimiento reducido, pausa |
| Páginas (UI) | `tests/ui/homeLanding.test.jsx` | Las 11: H1 único, title y canonical propios, enlaces válidos, FAQPage |
| SEO estático | `tests/static/homeSeo.test.jsx` | `index.html` igual a `src/seo`, JSON-LD válido, prerender al día, sitemap, robots |
| Acceso | `tests/ui/authScreen.test.jsx` | `/login` y `/registro` abren el formulario correcto |

## Verificación visual (navegador)
Sin scroll ni desborde en 375×812, 390×844, 412×915, 768×1024, 1024×768, 1280×720, 1366×768, 1440×900 y 1920×1080.
En 320×568 hay scroll vertical (esperado) y ningún desborde horizontal.

## No automatizado
Core Web Vitals reales (LCP, INP, CLS) y validación en Rich Results Test: se miden con el sitio publicado.
