// Historias de política de liga: la federación, el torneo de dos grupos, el descenso de los amigos y más
import { ARC_CATALOG, arcById } from '../../src/domain/arcCatalog'
import { LEAGUE_ARCS } from '../../src/domain/arcCatalogLiga'
import { chapterTemplate, stepArcs } from '../../src/domain/arcs'

const CATEGORIES = ['COMMUNITY', 'LOCKER_ROOM', 'BOARD_PRESS', 'FINANCIAL_CRISIS'] // las que acepta la base
const EFFECT_KEYS = new Set(['fans', 'board', 'locker', 'budget', 'morale', 'reputation', 'barra', 'favors', 'board_owed', 'board_set'])
const MARKERS = /\{(?!presidente\}|periodista\})[A-Za-z]+\}/

describe('historias de política de liga', () => {
  it('están en el catálogo y llegaron a seis', () => {
    expect(LEAGUE_ARCS.map(a => a.id)).toEqual(['torneo_grupos', 'descenso_amigos', 'tv_horarios', 'veedor_arbitros', 'clausura_sorpresa', 'ventana_pases'])
    for (const arc of LEAGUE_ARCS) expect(arcById(arc.id)).toBe(arc)
    expect(new Set(ARC_CATALOG.map(a => a.id)).size).toBe(ARC_CATALOG.length)
  })

  it('cuentan lo pedido: torneo de dos grupos y reglas de descenso que benefician a los amigos del presidente de la federación', () => {
    const grupos = JSON.stringify(arcById('torneo_grupos'))
    expect(grupos).toMatch(/dos grupos/)
    expect(grupos).toMatch(/zona de la gloria/)
    const descenso = JSON.stringify(arcById('descenso_amigos'))
    expect(descenso).toMatch(/descenso/i)
    expect(descenso).toMatch(/amigos de Don Anselmo/)
  })

  it('cada una tiene cuatro capítulos, categoría válida, opciones con efectos conocidos y sin marcadores sin resolver', () => {
    for (const arc of LEAGUE_ARCS) {
      expect(CATEGORIES).toContain(arc.category)
      expect(arc.chapters).toHaveLength(4)
      expect(arc.title && arc.tagline).toBeTruthy()
      arc.chapters.forEach((ch, i) => {
        expect(ch.options).toHaveLength(3)
        expect(JSON.stringify(ch)).not.toMatch(MARKERS)
        ch.options.forEach(opt => {
          expect(Object.keys(opt.effects).every(k => EFFECT_KEYS.has(k))).toBe(true)
          expect(Object.keys(opt.effects).length).toBeGreaterThan(0)
          if (i === 3) expect(opt.ending.length).toBeGreaterThan(40)
        })
      })
    }
  })

  it('ninguna opción es la mejor en todo: en cada capítulo hay un costo en algo', () => {
    for (const arc of LEAGUE_ARCS) {
      for (const ch of arc.chapters) {
        const dominated = ch.options.filter(opt => Object.values(opt.effects).every(v => v >= 0) && !opt.cost)
        expect(dominated.length).toBeLessThan(ch.options.length)
      }
    }
  })

  it('generan capítulos jugables con el código del evento y los personajes del club', () => {
    for (const arc of LEAGUE_ARCS) {
      const t = chapterTemplate(arc.id, 0, [], { journalist: { name: 'Pepe Cabrera', outlet: 'Radio del Barrio' }, president: { name: 'Don Ramón' } })
      expect(t.template_code).toBe(`ARC_${arc.id.toUpperCase()}_0`)
      expect(t.options).toHaveLength(3)
    }
  })

  it('pueden salir sorteadas después de las historias de siempre', () => {
    const done = ARC_CATALOG.filter(a => !a.id.match(/torneo_grupos/)).map(a => ({ id: a.id }))
    const r = stepArcs({ arcs: { done }, week: 6, rng: () => 0 })
    expect(r.deliver).toMatchObject({ arcId: 'torneo_grupos', index: 0 })
  })
})
