import { PUBLIC_PAGES, FOOTER_GROUPS, getPublicPage } from '../../src/data/publicPages'

describe('alcance de las páginas públicas desde el pie', () => {
  const featured = FOOTER_GROUPS.flatMap(g => g.links.map(l => l.path))

  it('el pie muestra solo lo esencial y todo lo que muestra existe', () => {
    expect(featured.length).toBeLessThanOrEqual(16)
    for (const p of featured) expect(getPublicPage(p), p).toBeTruthy()
    expect(new Set(featured).size).toBe(featured.length)
  })

  it('el pie incluye lo imprescindible: el juego, la demo, las guías, el soporte y lo legal', () => {
    for (const p of ['/juego', '/como-jugar', '/demo', '/guias', '/faq', '/contacto', '/privacidad', '/terminos']) expect(featured, p).toContain(p)
  })

  it('toda página pública se alcanza en dos clics como máximo (pie → página → enlaces "relacionados")', () => {
    const depth = new Map(featured.map(p => [p, 1]))
    const queue = [...featured]
    while (queue.length) {
      const path = queue.shift()
      for (const r of getPublicPage(path).related || []) {
        if (!depth.has(r)) { depth.set(r, depth.get(path) + 1); queue.push(r) }
      }
    }
    const all = PUBLIC_PAGES.map(p => p.path)
    expect([...depth.keys()].sort()).toEqual(all.sort())
    for (const [path, d] of depth) expect(d, path).toBeLessThanOrEqual(2)
  })
})
