import { PUBLIC_PAGES, PUBLIC_PATHS, FOOTER_GROUPS } from '../../src/data/publicPages'
import { HISTORICAL_CLUBS_BY_TIER } from '../../src/domain/historicalClubs'
import { breadcrumbStructuredData, pageStructuredData } from '../../src/seo/structuredData'
import { SITE } from '../../src/data/site'

const guides = PUBLIC_PAGES.filter(p => p.group === 'guias')
const words = (page) => [page.intro, ...page.sections.flatMap(s => [s.heading, ...s.body])].join(' ').split(/\s+/).length

describe('guías de contenido para buscadores', () => {
  it('hay un hub y quince guías con las rutas pensadas', () => {
    expect(guides.map(g => g.path)).toEqual([
      '/guias', '/guias/formacion-4-4-2', '/guias/formacion-4-3-3', '/guias/como-fichar-jugadores', '/guias/entrenamiento-y-lesiones',
      '/guias/finanzas-del-club', '/guias/como-ascender-de-categoria', '/guias/liga-con-amigos', '/guias/mejores-dt-argentinos', '/guias/simulador-de-futbol-argentino',
      '/guias/formacion-4-2-3-1', '/guias/formacion-5-3-2', '/guias/cantera-y-juveniles', '/guias/pelota-parada-y-penales', '/guias/prensa-y-dirigencia', '/guias/copas-y-torneos'
    ])
    expect(FOOTER_GROUPS.find(g => g.key === 'guias').links.map(l => l.path)).toEqual(['/guias', '/guias/como-fichar-jugadores', '/guias/como-ascender-de-categoria', '/guias/liga-con-amigos'])
  })

  it('cada guía tiene texto de verdad: al menos 300 palabras y 3 o más subtítulos', () => {
    for (const g of guides.filter(g => g.path !== '/guias')) {
      expect(words(g), g.path).toBeGreaterThanOrEqual(300)
      expect(g.sections.length, g.path).toBeGreaterThanOrEqual(5)
    }
  })

  it('títulos y descripciones con el largo que muestra Google, sin repetirse', () => {
    for (const p of PUBLIC_PAGES) {
      expect(p.title.length, p.path).toBeLessThanOrEqual(65)
      expect(p.description.length, p.path).toBeGreaterThanOrEqual(70)
      expect(p.description.length, p.path).toBeLessThanOrEqual(175)
    }
  })

  it('ninguna página pública nombra a un club real (decisión de marca y de derechos)', () => {
    const clubs = [...new Set(Object.values(HISTORICAL_CLUBS_BY_TIER).flat().map(c => c.name))].filter(n => n.length > 4)
    for (const p of PUBLIC_PAGES) {
      const text = JSON.stringify(p)
      for (const club of clubs) expect(text.includes(club), `${p.path} nombra a ${club}`).toBe(false)
    }
  })

  it('los enlaces relacionados existen y las guías se enlazan entre sí', () => {
    for (const p of PUBLIC_PAGES) for (const r of p.related || []) expect(PUBLIC_PATHS, `${p.path} -> ${r}`).toContain(r)
    const hub = guides.find(g => g.path === '/guias')
    expect(hub.related).toHaveLength(15)
  })

  it('las páginas internas publican migas de pan; las guías pasan por el hub', () => {
    const g = guides.find(x => x.path === '/guias/formacion-4-4-2')
    const crumbs = breadcrumbStructuredData(g).itemListElement
    expect(crumbs.map(c => c.name)).toEqual(['Inicio', 'Guías', 'Formación 4-4-2'])
    expect(crumbs[1].item).toBe(`${SITE.url}/guias`)
    expect(pageStructuredData(g)['@graph']).toHaveLength(1)
    expect(pageStructuredData(PUBLIC_PAGES.find(p => p.path === '/faq'))['@graph']).toHaveLength(2)
  })
})
