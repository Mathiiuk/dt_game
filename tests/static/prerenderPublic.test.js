import { readFileSync } from 'node:fs'
import { applyPageToTemplate, sitemapXml, pageOutputPath } from '../../src/seo/prerender'
import { PUBLIC_PAGES, PUBLIC_PATHS } from '../../src/data/publicPages'
import { SITE } from '../../src/data/site'

const template = readFileSync('index.html', 'utf8')
const faq = PUBLIC_PAGES.find(p => p.path === '/faq')
const how = PUBLIC_PAGES.find(p => p.path === '/como-jugar')
const out = (page, markup = '<h1>Hola</h1>') => applyPageToTemplate(template, page, markup, { jsonLd: page.faq ? { '@graph': [{ '@type': 'FAQPage' }] } : null })

describe('HTML propio de cada página pública', () => {
  it('cada página sale con su título, descripción, canonical y Open Graph', () => {
    const html = out(how)
    expect(html).toContain(`<title>${how.title}</title>`)
    expect(html).toContain(`<meta name="description" content="${how.description}"`)
    expect(html).toContain(`<link rel="canonical" href="${SITE.url}/como-jugar"`)
    expect(html).toContain(`<meta property="og:url" content="${SITE.url}/como-jugar"`)
    expect(html).toContain(`<meta property="og:title" content="${how.title}"`)
    expect(html).not.toContain('<title>Vestuario | Juego de Director Técnico de Fútbol</title>')
  })

  it('el contenido va dentro de #root, marcado como prerenderizado, sin restos de la portada', () => {
    const html = out(how, '<h1>Cómo jugar a Vestuario</h1>')
    expect(html).toContain('<div id="root" data-prerendered="/como-jugar"><h1>Cómo jugar a Vestuario</h1></div>')
    expect(html).not.toContain('home:start')
    expect(html).not.toContain('Vos sos')
  })

  it('el JSON-LD de la home no se copia; las preguntas frecuentes llevan el suyo', () => {
    expect(out(how)).not.toContain('"VideoGame"')
    expect(out(how)).not.toContain('id="ld-page"')
    expect(out(faq)).toContain('"FAQPage"')
  })

  it('conserva GTM y el consentimiento, y el script que limpia la portada respeta lo prerenderizado', () => {
    const html = out(how)
    expect(html).toContain('GTM-NC5G56KV')
    expect(html).toContain("gtag('consent', 'default'")
    expect(template).toMatch(/hasAttribute\('data-prerendered'\)/)
  })

  it('escapa comillas y signos en título y descripción', () => {
    const html = out({ ...how, title: 'A "B" & <C>', description: 'x "y" & <z>' })
    expect(html).toContain('<title>A "B" &amp; &lt;C&gt;</title>')
    expect(html).toContain('content="x &quot;y&quot; &amp; &lt;z&gt;"')
  })

  it('cada ruta se guarda como carpeta con index.html (Vercel la sirve sin reescribir)', () => {
    expect(pageOutputPath('/como-jugar')).toBe('como-jugar/index.html')
    expect(pageOutputPath('/')).toBe('index.html')
  })

  it('el sitemap lista todas las páginas públicas con la fecha de la compilación', () => {
    const xml = sitemapXml(PUBLIC_PATHS, '2026-10-11')
    for (const p of PUBLIC_PATHS) expect(xml).toContain(`<loc>${SITE.url}${p}</loc>`)
    expect((xml.match(/<lastmod>2026-10-11<\/lastmod>/g) || []).length).toBe(PUBLIC_PATHS.length)
  })

  it('la compilación genera las páginas y el sitemap después de vite build', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.scripts.build).toMatch(/vite build && node scripts\/prerender-public\.mjs/)
    expect(readFileSync('public/sitemap.xml', 'utf8')).toContain(`${SITE.url}/mercado-de-pases`)
  })
})

describe('imagen de vista previa por página', () => {
  it('cada página usa su propia imagen en og:image', async () => {
    const { ogSlug, ogImageUrl } = await import('../../src/seo/prerender')
    expect(ogSlug('/guias/formacion-4-4-2')).toBe('guias-formacion-4-4-2')
    expect(ogSlug('/faq')).toBe('faq')
    const html = applyPageToTemplate(template, how, '<h1>x</h1>')
    expect(html).toContain(`<meta property="og:image" content="${ogImageUrl('/como-jugar')}"`)
    expect(html).not.toContain('vestuario-og-home.webp"')
  })

  it('las imágenes existen para todas las páginas, en 1200x630 y livianas', async () => {
    const { ogSlug } = await import('../../src/seo/prerender')
    const { statSync } = await import('node:fs')
    for (const p of PUBLIC_PAGES) {
      const size = statSync(`public/og/${ogSlug(p.path)}.webp`).size
      expect(size, p.path).toBeGreaterThan(2000)
      expect(size, p.path).toBeLessThan(150 * 1024)
    }
  })

  it('todas las páginas públicas prerenderizadas conservan la meta de verificación de Bing', () => {
    for (const page of PUBLIC_PAGES) {
      const html = out(page)
      expect(html, page.path).toContain('<meta name="msvalidate.01" content="2B5274C4AA9B4D2DD7CE71011809C363" />')
      expect(html.split('msvalidate.01'), page.path).toHaveLength(2)
    }
  })
})
