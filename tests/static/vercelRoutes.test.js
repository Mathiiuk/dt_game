import { readFileSync } from 'node:fs'
import { GAME_PATHS } from '../../src/data/gameRoutes'
import { build404Html } from '../../src/seo/prerender'

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'))
const gameApp = readFileSync('src/GameApp.jsx', 'utf8')
const template = readFileSync('index.html', 'utf8')

describe('404 real en Vercel', () => {
  it('ya no se reescribe todo a la app: solo las rutas del juego, el resto cae en 404.html con estado 404', () => {
    expect(vercel.rewrites.some(r => r.source === '/(.*)')).toBe(false)
    expect(vercel.rewrites).toHaveLength(2)
    vercel.rewrites.forEach(r => expect(r.destination).toBe('/index.html'))
  })

  it('el perfil público del DT (/dt/<dirección>) también entra a la app', () => {
    expect(vercel.rewrites).toContainEqual({ source: '/dt/:slug', destination: '/index.html' })
  })

  it('la lista de rutas del juego coincide con las de vercel.json y con las de GameApp', () => {
    const gameRewrite = vercel.rewrites.find(r => r.source.startsWith('/('))
    const inVercel = gameRewrite.source.match(/^\/\((.*)\)$/)[1].split('|').map(p => `/${p}`)
    expect([...inVercel].sort()).toEqual([...GAME_PATHS].sort())
    const inApp = [...gameApp.matchAll(/path="(\/[a-z-]+)"/g)].map(m => m[1])
    expect([...new Set(inApp)].sort()).toEqual([...GAME_PATHS].sort())
  })

  it('el 404.html no se indexa, no declara canonical y trae la pantalla y el contenedor de la app', () => {
    const html = build404Html(template, '<h1>No existe</h1>')
    expect(html).toContain('<title>Página no encontrada | Vestuario</title>')
    expect(html).toContain('<meta name="robots" content="noindex,nofollow"')
    expect(html).not.toContain('<link rel="canonical"')
    expect(html).not.toContain('id="ld-page"')
    expect(html).toContain('<div id="root" data-prerendered="/404"><h1>No existe</h1></div>')
    expect(html).toContain('GTM-NC5G56KV')
  })

  it('los archivos con hash de /assets se cachean un año sin revalidar; index.html y sw.js siguen revalidando', () => {
    const headerOf = (source) => Object.fromEntries((vercel.headers.find(h => h.source === source)?.headers || []).map(h => [h.key, h.value]))
    expect(headerOf('/assets/(.*)')['Cache-Control']).toBe('public, max-age=31536000, immutable')
    expect(headerOf('/index.html')['Cache-Control']).toMatch(/must-revalidate/)
    expect(headerOf('/sw.js')['Cache-Control']).toMatch(/must-revalidate/)
  })
})
