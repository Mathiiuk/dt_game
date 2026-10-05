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
    expect(attr(/<link rel="canonical" href="([^"]*)"/)).toBe('https://vestuario.com.ar/')
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
    expect(robots).toContain('Sitemap: https://vestuario.com.ar/sitemap.xml')
  })

  it('las rutas del juego del código están todas bloqueadas en robots.txt', () => {
    const blocked = [...robots.matchAll(/^Disallow: (\S+)$/gm)].map(m => m[1])
    const routes = [...readFileSync('src/GameApp.jsx', 'utf8').matchAll(/path="(\/[a-z-]+)"/g)].map(m => m[1])
    expect(routes.length).toBeGreaterThan(20)
    expect(routes.filter(route => !blocked.includes(route))).toEqual([])
  })
})
