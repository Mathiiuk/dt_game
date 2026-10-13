# SEO técnico: indexación y visibilidad (skill seo-indexing-visibility)

Rama `feat/seo-indexacion`. `agt` no está instalado: se emuló el flujo (rama, TDD, gates, reporte).

## Alcance y límites
Auditoría pública de www.vestuario.com.ar. Sin acceso a Search Console ni Bing Webmaster: sus estados están **pendientes de acceso**. Nada de lo hecho garantiza indexación, tráfico ni posiciones.

## Hallazgos y cambios
| ID | Sev. | Evidencia | Cambio | Prueba |
|---|---|---|---|---|
| S1 | P2 | `/dt/x` y rutas privadas responden con el HTML de la home (canonical a `/`, `index,follow`); el noindex llega recién con JS | `X-Robots-Tag: noindex, nofollow` en `vercel.json` para esas rutas; `/dt` no se bloquea en robots.txt para que se lea el noindex | `tests/static/vercelHeaders.test.js` |
| S2 | P3 | `lastmod` de las 29 URLs = fecha del build | `CONTENT_UPDATED` + `updated` por página (`pageLastmod`), usado por el sitemap | `tests/static/prerenderPublic.test.js` |
| S3 | P3 | Sin IndexNow | Clave pública `public/<clave>.txt`, `src/seo/indexnow.js`, `npm run indexnow` (valida host https, reintentos 2 s/4 s, solo 200/202 = enviado) | `tests/static/indexnow.test.js` |

## Verificado antes del cambio (ok)
robots.txt con `Sitemap:`; sitemap 200 con URLs absolutas; apex → www (308); canonical propio e `index,follow` en páginas públicas; 404 real con noindex; un h1 en el HTML inicial; JSON-LD presente.

## Regla de mantenimiento
Al editar el texto de una página pública, actualizar su `updated` (o `CONTENT_UPDATED`).

## Seguimiento
Revisar a los días 7, 14 y 30: URLs indexadas/excluidas por motivo, estado del sitemap, canonical elegida, impresiones y clics.

## Pendientes del usuario (requieren sus cuentas)
- Search Console: propiedad de dominio, enviar `sitemap.xml`, inspeccionar `/`, `/juego` y dos guías.
- Bing Webmaster: tocar "Verificar" y enviar el sitemap.
- Correr `npm run indexnow` después de cada deploy con cambios de contenido (lo hace la sesión una vez en producción).

## Checklist de cierre
Dominio canónico ✔ · robots ✔ · meta robots/X-Robots-Tag ✔ · canonicals ✔ · sitemap válido ✔ · envío a Google/Bing: pendiente del usuario · IndexNow: implementado, envío real pendiente de deploy · sin promesas de ranking ✔.
