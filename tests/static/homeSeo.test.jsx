import React from 'react'
import { readFileSync, writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import HomeLanding from '../../src/features/home/HomeLanding'
import { HOME_COPY, HOME_SEO } from '../../src/seo/homeSeo'
import { homeStructuredData } from '../../src/seo/structuredData'
import { PUBLIC_PATHS } from '../../src/data/publicPages'
import { absoluteUrl } from '../../src/data/site'

// SEO estático de la portada: index.html tiene que decir lo mismo que el código (src/seo) y traer la portada
// ya escrita. Para regenerar el prerender y el JSON-LD después de cambiar la Home:
//   HOME_PRERENDER=write npx vitest run tests/static/homeSeo.test.jsx
const START = '<!--home:start-->'
const END = '<!--home:end-->'
const LD = /(<script type="application\/ld\+json" id="ld-page">)([\s\S]*?)(<\/script>)/

const markup = renderToStaticMarkup(<MemoryRouter initialEntries={['/']}><HomeLanding /></MemoryRouter>)
const jsonLd = JSON.stringify(homeStructuredData())

if (process.env.HOME_PRERENDER === 'write') {
  const html = readFileSync('index.html', 'utf8')
  const before = html.slice(0, html.indexOf(START) + START.length)
  const after = html.slice(html.indexOf(END))
  writeFileSync('index.html', (before + markup + after).replace(LD, (_, open, __, close) => open + jsonLd + close))
}

const html = readFileSync('index.html', 'utf8')
const attr = (re) => html.match(re)?.[1]

describe('SEO estático de la portada (index.html)', () => {
  it('idioma, título, descripción, canonical y robots', () => {
    expect(html).toContain('<html lang="es-AR">')
    expect(attr(/<title>([^<]*)<\/title>/)).toBe(HOME_SEO.title)
    expect(attr(/<meta name="description" content="([^"]*)"/)).toBe(HOME_SEO.description)
    expect(attr(/<link rel="canonical" href="([^"]*)"/)).toBe('https://www.vestuario.com.ar/')
    expect(attr(/<meta name="robots" content="([^"]*)"/)).toBe('index,follow')
  })

  it('Open Graph completo y con imagen propia', () => {
    expect(attr(/property="og:title" content="([^"]*)"/)).toBe(HOME_SEO.ogTitle)
    expect(attr(/property="og:description" content="([^"]*)"/)).toBe(HOME_SEO.ogDescription)
    expect(attr(/property="og:url" content="([^"]*)"/)).toBe(absoluteUrl('/'))
    expect(attr(/property="og:type" content="([^"]*)"/)).toBe(HOME_SEO.ogType)
    expect(attr(/property="og:image" content="([^"]*)"/)).toBe(HOME_SEO.ogImage)
    expect(readFileSync('public/vestuario-og-home.webp').length).toBeLessThan(200 * 1024)
  })

  it('el JSON-LD es válido, coincide con el del código y no inventa puntajes ni precios', () => {
    const data = JSON.parse(html.match(LD)[2])
    expect(data).toEqual(homeStructuredData())
    const types = data['@graph'].flatMap(node => node['@type'])
    expect(types).toEqual(expect.arrayContaining(['Organization', 'VideoGame', 'WebApplication']))
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|review|offers|price|award/i)
  })

  it('la portada está prerenderizada y al día con el componente', () => {
    const current = html.slice(html.indexOf(START) + START.length, html.indexOf(END))
    expect(current).toBe(markup)
  })

  it('el prerender tiene un único H1 y el texto de contexto a la vista', () => {
    expect(markup.match(/<h1/g)).toHaveLength(1)
    expect(markup.replace(/<[^>]+>/g, '')).toContain(HOME_COPY.h1)
    expect(markup).toContain(HOME_COPY.subheadline)
    expect(markup).toContain(HOME_COPY.context)
    expect(markup).not.toMatch(/display:\s*none|visibility:\s*hidden/)
  })

  it('"Vestuario" queda asociado a juego, DT y fútbol en título, descripción y contenido', () => {
    for (const text of [HOME_SEO.title, HOME_SEO.description, HOME_COPY.context]) {
      expect(text).toMatch(/Vestuario/)
      expect(text).toMatch(/juego/i)
      expect(text).toMatch(/Director Técnico/)
      expect(text).toMatch(/f[úu]tbol/i)
    }
  })
})

describe('rastreo: sitemap y robots', () => {
  const sitemap = readFileSync('public/sitemap.xml', 'utf8')
  const robots = readFileSync('public/robots.txt', 'utf8')

  it('el sitemap lista exactamente las páginas públicas', () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    expect(locs.sort()).toEqual(PUBLIC_PATHS.map(absoluteUrl).sort())
  })

  it('robots.txt deja pasar la parte pública, bloquea el juego y apunta al sitemap', () => {
    const blocked = [...robots.matchAll(/^Disallow: (\S+)$/gm)].map(m => m[1])
    for (const path of ['/dashboard', '/squad', '/tactics', '/market', '/training', '/match', '/club', '/manager', '/auth']) {
      expect(blocked).toContain(path)
    }
    // Ninguna página pública queda bloqueada por un prefijo
    for (const path of PUBLIC_PATHS.filter(p => p !== '/')) {
      expect(blocked.some(rule => path.startsWith(rule))).toBe(false)
    }
    expect(robots).toContain('Sitemap: https://www.vestuario.com.ar/sitemap.xml')
  })

  it('las rutas del juego del código están todas bloqueadas en robots.txt', () => {
    const blocked = [...robots.matchAll(/^Disallow: (\S+)$/gm)].map(m => m[1])
    const routes = [...readFileSync('src/GameApp.jsx', 'utf8').matchAll(/path="(\/[a-z-]+)"/g)].map(m => m[1])
    expect(routes.length).toBeGreaterThan(20)
    expect(routes.filter(route => !blocked.includes(route))).toEqual([])
  })
})

describe('verificación de Bing Webmaster (msvalidate.01)', () => {
  const META = '<meta name="msvalidate.01" content="2B5274C4AA9B4D2DD7CE71011809C363" />'
  const page = readFileSync('index.html', 'utf8')
  const head = page.slice(0, page.indexOf('</head>'))

  it('la portada trae la meta de verificación una sola vez, dentro del head', () => {
    expect(head).toContain(META)
    expect(page.split('msvalidate.01')).toHaveLength(2)
  })

  it('queda junto a los metadatos de SEO (antes de los datos estructurados y del cuerpo)', () => {
    expect(head.indexOf(META)).toBeGreaterThan(head.indexOf('<meta name="robots"'))
    expect(page.indexOf(META)).toBeLessThan(page.indexOf('<body>'))
  })
})

describe('medición (Google Tag Manager) en index.html', () => {
  const page = readFileSync('index.html', 'utf8')
  const head = page.slice(0, page.indexOf('</head>'))

  it('carga el contenedor GTM-NC5G56KV en el head y su versión noscript al abrir el body', () => {
    expect(head).toContain("'GTM-NC5G56KV'")
    expect(head).toContain('https://www.googletagmanager.com/gtm.js?id=')
    const afterBody = page.slice(page.indexOf('<body>'), page.indexOf('<body>') + 400)
    expect(afterBody).toContain('https://www.googletagmanager.com/ns.html?id=GTM-NC5G56KV')
  })

  it('GTM se carga recién cuando la página terminó de cargar y el navegador está libre (no compite con el primer dibujo)', () => {
    const gtm = head.slice(head.indexOf('Google Tag Manager'), head.indexOf('End Google Tag Manager'))
    expect(gtm).toMatch(/addEventListener\('load'/)
    expect(gtm).toMatch(/requestIdleCallback|setTimeout/)
    // sigue el orden: el consentimiento denegado queda antes del contenedor
    expect(head.indexOf("gtag('consent', 'default'")).toBeLessThan(head.indexOf('gtm.start'))
  })

  it('el consentimiento arranca denegado ANTES de cargar GTM y reaplica lo aceptado', () => {
    const consentAt = head.indexOf("gtag('consent', 'default'")
    expect(consentAt).toBeGreaterThan(-1)
    expect(consentAt).toBeLessThan(head.indexOf('googletagmanager.com/gtm.js'))
    expect(head).toMatch(/analytics_storage: 'denied'/)
    expect(head).toContain("localStorage.getItem('vestuario-consent') === 'granted'")
  })
})
