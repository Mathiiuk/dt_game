// Después de `vite build`: escribe dist/<ruta>/index.html para cada página pública y un sitemap con fecha.
// Usa Vite en modo servidor sólo para cargar los componentes (JSX, alias) y renderizarlos a HTML.
import { createServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const dist = 'dist'
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', configFile: 'vite.config.ts' })
try {
  const { applyPageToTemplate, pageOutputPath, sitemapXml, build404Html } = await server.ssrLoadModule('/src/seo/prerender.js')
  const { PUBLIC_PAGES, PUBLIC_PATHS, renderPage, pageJsonLd, renderNotFound } = await server.ssrLoadModule('/src/seo/prerenderEntry.jsx')

  for (const page of PUBLIC_PAGES) {
    const html = applyPageToTemplate(template, page, renderPage(page), { jsonLd: pageJsonLd(page) })
    const file = join(dist, pageOutputPath(page.path))
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, html)
  }
  writeFileSync(join(dist, '404.html'), build404Html(template, renderNotFound()))
  writeFileSync(join(dist, 'sitemap.xml'), sitemapXml(PUBLIC_PATHS, new Date().toISOString().slice(0, 10)))
  console.log(`Prerender: ${PUBLIC_PAGES.length} páginas públicas, 404.html y sitemap en ${dist}/`)
} finally {
  await server.close()
}
