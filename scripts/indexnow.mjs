// Después de un deploy: avisa a IndexNow las URLs del sitemap publicado (lee el sitemap de producción, no el local).
// Uso: npm run indexnow            (todas las URLs)   |   npm run indexnow -- /faq /guias   (solo esas rutas)
import { createServer } from 'vite'
import { SITE } from '../src/data/site.js'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', configFile: 'vite.config.ts' })
try {
  const { urlsFromSitemap, submitUrls } = await server.ssrLoadModule('/src/seo/indexnow.js')
  const paths = process.argv.slice(2)
  let urls
  if (paths.length > 0) urls = paths.map(p => `${SITE.url}${p.startsWith('/') ? p : `/${p}`}`)
  else {
    const res = await fetch(`${SITE.url}/sitemap.xml`)
    if (!res.ok) throw new Error(`No se pudo leer el sitemap (${res.status})`)
    urls = urlsFromSitemap(await res.text())
  }
  const result = await submitUrls(urls)
  console.log(`IndexNow: ${urls.length} URL(s) · respuesta ${result.status ?? '-'} · ${result.ok ? `enviadas ${result.sent}` : 'NO enviadas'}`)
  process.exitCode = result.ok ? 0 : 1
} finally {
  await server.close()
}
