// HTML propio de cada página pública, generado al compilar: buscadores y redes ven el título, el texto y el canonical de la página
// sin ejecutar JavaScript. Funciones puras sobre texto (las usa scripts/prerender-public.mjs).
import { SITE } from '../data/site'

const escapeAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeText = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const ROOT_START = '<div id="root"><!--home:start-->'
const ROOT_END = '<!--home:end--></div>'

/** Nombre de archivo de la imagen de vista previa de una ruta: /guias/formacion-4-4-2 -> guias-formacion-4-4-2 */
export const ogSlug = (path) => path.replace(/^\//, '').replace(/\//g, '-') || 'home'

/** URL de la imagen de vista previa de una página */
export const ogImageUrl = (path) => `${SITE.url}/og/${ogSlug(path)}.webp`

/** Página `page` ({ path, title, description }) armada sobre la plantilla (index.html compilado) con su `markup` dentro de #root */
export function applyPageToTemplate(template, page, markup, { jsonLd = null } = {}) {
  const url = `${SITE.url}${page.path}`
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(page.title)}</title>`)
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(page.description)}$2`)
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(page.title)}$2`)
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(page.description)}$2`)
  html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${ogImageUrl(page.path)}$2`)
  const ldTag = /<script type="application\/ld\+json" id="ld-page">[\s\S]*?<\/script>/
  html = html.replace(ldTag, jsonLd ? `<script type="application/ld+json" id="ld-page">${JSON.stringify(jsonLd)}</script>` : '')
  const start = html.indexOf(ROOT_START)
  const end = html.indexOf(ROOT_END)
  if (start === -1 || end === -1) throw new Error('index.html no trae la portada prerenderizada (home:start/home:end)')
  return html.slice(0, start) + `<div id="root" data-prerendered="${escapeAttr(page.path)}">${markup}</div>` + html.slice(end + ROOT_END.length)
}

/** Dónde se guarda el HTML de cada ruta dentro de dist */
export const pageOutputPath = (path) => (path === '/' ? 'index.html' : `${path.replace(/^\//, '')}/index.html`)

export function sitemapXml(paths, lastmod) {
  const urls = paths.map(p => `  <url><loc>${SITE.url}${p}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** 404.html: la pantalla de página inexistente sobre la plantilla, sin canonical ni datos de la portada y con noindex (Vercel la sirve con estado 404) */
export function build404Html(template, markup) {
  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>Página no encontrada | Vestuario</title>')
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, '$1Esta página no existe.$2')
  html = html.replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="noindex,nofollow"')
  html = html.replace(/<link rel="canonical"[^>]*>\n?/, '').replace(/<meta property="og:url"[^>]*>\n?/, '')
  html = html.replace(/<script type="application\/ld\+json" id="ld-page">[\s\S]*?<\/script>/, '')
  const start = html.indexOf(ROOT_START)
  const end = html.indexOf(ROOT_END)
  if (start === -1 || end === -1) throw new Error('index.html no trae la portada prerenderizada (home:start/home:end)')
  return html.slice(0, start) + `<div id="root" data-prerendered="/404">${markup}</div>` + html.slice(end + ROOT_END.length)
}
