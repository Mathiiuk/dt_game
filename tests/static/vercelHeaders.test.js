import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
const robots = readFileSync('public/robots.txt', 'utf8')

// Las mismas rutas que se reescriben a la app: lo privado y los perfiles /dt/<slug>
const rewriteSources = config.rewrites.map(r => r.source)
const noindexBlocks = config.headers.filter(h => h.headers.some(x => x.key === 'X-Robots-Tag'))

describe('cabecera X-Robots-Tag en las rutas que no son páginas públicas', () => {
  it('cada ruta reescrita a la app (privada o de perfil) sale con noindex en la cabecera HTTP', () => {
    const covered = noindexBlocks.map(h => h.source)
    for (const source of rewriteSources) expect(covered).toContain(source)
    for (const block of noindexBlocks) {
      expect(block.headers.find(x => x.key === 'X-Robots-Tag').value).toBe('noindex, nofollow')
    }
  })

  it('las páginas públicas y los assets no llevan noindex', () => {
    const sources = noindexBlocks.map(h => h.source).join(' ')
    expect(sources).not.toMatch(/guias|juego|faq|assets|sitemap|robots/)
    expect(sources).not.toBe('/(.*)')
  })

  it('el perfil /dt/<slug> no se bloquea en robots.txt: así el rastreador puede leer el noindex', () => {
    expect(robots).not.toMatch(/Disallow:\s*\/dt/)
  })
})
