import { ARC_CATALOG } from '../../src/domain/arcCatalog'
import { endingFor, closingTail, stepArcs, resolveChapter, chapterTemplate, parseArcCode, arcChapterCode, pickArc, normalizeArcs, ARC_GAP_WEEKS, ARC_COOLDOWN_WEEKS, ARC_FIRST_WEEK } from '../../src/domain/arcs'
import { seasonStory } from '../../src/domain/seasonStory'

const always = () => 0 // sortea siempre que sí y elige la primera historia

describe('catálogo de historias', () => {
  it('hay al menos cinco historias de cuatro capítulos con opciones válidas', () => {
    expect(ARC_CATALOG.length).toBeGreaterThanOrEqual(5)
    for (const arc of ARC_CATALOG) {
      expect(arc.chapters).toHaveLength(4)
      arc.chapters.forEach((ch, i) => {
        expect(ch.options.length).toBeGreaterThanOrEqual(2)
        expect(new Set(ch.options.map(o => o.id)).size).toBe(ch.options.length)
        ch.options.forEach(o => {
          expect(o.label && o.description).toBeTruthy()
          // El último capítulo cierra la historia con un desenlace; los otros dejan una marca
          if (i === arc.chapters.length - 1) expect(o.ending).toBeTruthy()
          else expect(o.flag).toBeTruthy()
        })
      })
    }
  })

  it('las marcas de recuerdo apuntan a opciones que existen en capítulos anteriores', () => {
    for (const arc of ARC_CATALOG) {
      arc.chapters.forEach((ch, i) => {
        const earlier = new Set(arc.chapters.slice(0, i).flatMap(c => c.options.map(o => o.flag)))
        Object.keys(ch.memory || {}).forEach(flag => expect(earlier.has(flag)).toBe(true))
      })
    }
  })
})

describe('plantilla de capítulo', () => {
  it('lleva código, numeración y el recuerdo de lo que elegiste', () => {
    const t = chapterTemplate('pibe', 1, ['FICHADO'])
    expect(t.template_code).toBe('ARC_PIBE_1')
    expect(t.title).toMatch(/\(2\/4\)$/)
    expect(t.description).toMatch(/Lo trajiste vos/)
    expect(chapterTemplate('pibe', 1, ['ESPERA']).description).not.toMatch(/Lo trajiste vos/)
  })

  it('nombra a los personajes del club y nunca deja llaves', () => {
    const t = chapterTemplate('pibe', 2, [], { journalist: { name: 'Pepe Cabrera', outlet: 'Radio del Barrio' } })
    expect(t.description).toMatch(/Pepe Cabrera/)
    ARC_CATALOG.forEach(a => a.chapters.forEach((_, i) => expect(JSON.stringify(chapterTemplate(a.id, i, [], null))).not.toMatch(/{[A-Za-z]+}/)))
  })

  it('reconoce los códigos de capítulo', () => {
    expect(parseArcCode(arcChapterCode('mano', 3))).toEqual({ arcId: 'mano', index: 3 })
    expect(parseArcCode('EVT_BARRA_ASKS')).toBeNull()
  })
})

describe('avance semanal de las historias', () => {
  it('no empiezan antes de la fecha 3 ni con la bandeja de eventos llena', () => {
    expect(stepArcs({ arcs: {}, week: ARC_FIRST_WEEK - 1, rng: always }).deliver).toBeNull()
    expect(stepArcs({ arcs: {}, week: 10, pendingEvents: 3, rng: always }).deliver).toBeNull()
  })

  it('empieza una historia que no viviste y entrega el primer capítulo', () => {
    const r = stepArcs({ arcs: { done: [{ id: ARC_CATALOG[0].id }] }, week: 5, rng: always })
    expect(r.started).toBe(true)
    expect(r.deliver).toMatchObject({ arcId: ARC_CATALOG[1].id, index: 0 })
    expect(r.arcs.active).toMatchObject({ chapter: 0, delivered: true })
  })

  it('con la suerte en contra no empieza', () => {
    expect(stepArcs({ arcs: {}, week: 5, rng: () => 0.99 }).deliver).toBeNull()
  })

  it('una sola historia a la vez: con un capítulo esperando tu decisión no entrega otro', () => {
    const arcs = { active: { id: 'pibe', chapter: 0, delivered: true, wait: 0, flags: [] }, cooldown: 0, done: [] }
    expect(stepArcs({ arcs, week: 6, rng: always }).deliver).toBeNull()
  })

  it('si el evento del capítulo desapareció, se vuelve a entregar', () => {
    const arcs = { active: { id: 'pibe', chapter: 1, delivered: true, wait: 0, flags: ['FICHADO'] }, cooldown: 0, done: [] }
    expect(stepArcs({ arcs, week: 6, chapterPending: false, rng: always }).deliver).toMatchObject({ arcId: 'pibe', index: 1 })
  })

  it('el capítulo siguiente llega tres semanas después de resolver el anterior', () => {
    let arcs = { active: { id: 'pibe', chapter: 0, delivered: true, wait: 0, flags: [] }, cooldown: 0, done: [] }
    arcs = resolveChapter(arcs, 'ARC_PIBE_0', 'A').arcs
    expect(arcs.active).toMatchObject({ chapter: 1, delivered: false, wait: ARC_GAP_WEEKS, flags: ['FICHADO'] })
    for (let w = 1; w < ARC_GAP_WEEKS; w++) {
      const r = stepArcs({ arcs, week: 10 + w, rng: always })
      expect(r.deliver).toBeNull()
      arcs = r.arcs
    }
    const last = stepArcs({ arcs, week: 20, rng: always })
    expect(last.deliver).toMatchObject({ arcId: 'pibe', index: 1, flags: ['FICHADO'] })
  })

  it('con la bandeja llena espera hasta que haya lugar', () => {
    const arcs = { active: { id: 'pibe', chapter: 1, delivered: false, wait: 1, flags: [] }, cooldown: 0, done: [] }
    const full = stepArcs({ arcs, week: 9, pendingEvents: 3, rng: always })
    expect(full.deliver).toBeNull()
    expect(stepArcs({ arcs: full.arcs, week: 10, pendingEvents: 1, rng: always }).deliver).toMatchObject({ index: 1 })
  })
})

describe('cierre de capítulos', () => {
  it('el último capítulo cierra la historia con su desenlace y deja un descanso', () => {
    const arcs = { active: { id: 'pibe', chapter: 3, delivered: true, wait: 0, flags: ['FICHADO'] }, cooldown: 0, done: [] }
    const r = resolveChapter(arcs, 'ARC_PIBE_3', 'B', 2026)
    expect(r.finished).toMatchObject({ id: 'pibe', season: 2026 })
    expect(r.finished.ending).toMatch(/se quedó/)
    expect(r.arcs.active).toBeNull()
    expect(r.arcs.cooldown).toBe(ARC_COOLDOWN_WEEKS)
    expect(r.arcs.done).toHaveLength(1)
  })

  it('durante el descanso no empieza otra y después sí', () => {
    let arcs = { active: null, cooldown: ARC_COOLDOWN_WEEKS, done: [{ id: 'pibe' }] }
    for (let i = 0; i < ARC_COOLDOWN_WEEKS; i++) {
      const r = stepArcs({ arcs, week: 12, rng: always })
      expect(r.deliver).toBeNull()
      arcs = r.arcs
    }
    expect(stepArcs({ arcs, week: 12, rng: always }).deliver).not.toBeNull()
  })

  it('un evento que no es de la historia activa no la mueve', () => {
    const arcs = { active: { id: 'pibe', chapter: 1, delivered: true, wait: 0, flags: [] }, cooldown: 0, done: [] }
    expect(resolveChapter(arcs, 'ARC_MANO_0', 'A').arcs).toEqual(normalizeArcs(arcs))
    expect(resolveChapter(arcs, 'ARC_PIBE_0', 'A').arcs).toEqual(normalizeArcs(arcs))
  })

  it('cuando ya viviste todas las historias vuelven a entrar todas', () => {
    expect(ARC_CATALOG.map(a => a.id)).toContain(pickArc(ARC_CATALOG.map(a => ({ id: a.id })), always).id)
  })
})

describe('resumen de la temporada', () => {
  it('cuenta los desenlaces de las historias cerradas', () => {
    const story = seasonStory({ clubName: 'Mi Club', position: 5, cash: 10000, arcs: [{ title: 'El pibe del potrero', ending: 'El pibe se quedó.' }] })
    expect(story.lines.some(l => l.includes('El pibe del potrero: El pibe se quedó.'))).toBe(true)
  })
})

describe('finales con ramas', () => {
  const option = { ending: 'Final base.', variants: [{ if: 'FICHADO', ending: 'Final del que lo trajo.' }, { if: 'PERDIDO', ending: 'Final del que lo dejó ir.' }] }

  it('sin variantes ni contexto el final es el de siempre', () => {
    expect(endingFor({ ending: 'Final base.' }, [], {})).toBe('Final base.')
    expect(endingFor({ ending: 'Final base.' }, ['X'])).toBe('Final base.')
  })
  it('una marca del camino elegido cambia el final; si no coincide, queda el base; gana la primera que coincide', () => {
    expect(endingFor(option, ['FICHADO'], {})).toBe('Final del que lo trajo.')
    expect(endingFor(option, ['PERDIDO'], {})).toBe('Final del que lo dejó ir.')
    expect(endingFor(option, ['OTRA'], {})).toBe('Final base.')
    expect(endingFor(option, ['PERDIDO', 'FICHADO'], {})).toBe('Final del que lo trajo.')
  })
  it('el estado del club agrega una frase de cierre: la barra manda sobre la dirigencia y esta sobre los favores', () => {
    expect(closingTail({ barra: 'INVASION', board: 90, favors: 5 })).toMatch(/barra/i)
    expect(closingTail({ barra: 'SQUEEZES' })).toMatch(/barra/i)
    expect(closingTail({ barra: 'CALM', board: 20 })).toMatch(/palco|continuidad/i)
    expect(closingTail({ barra: 'CALM', board: 85 })).toMatch(/dirigencia/i)
    expect(closingTail({ barra: 'CALM', board: 50, favors: 3 })).toMatch(/favores/i)
    expect(closingTail({ barra: 'CALM', board: 50, favors: 1 })).toBe('')
    expect(closingTail({})).toBe('')
  })
  it('el final con contexto suma la frase de cierre al texto de la variante', () => {
    const text = endingFor(option, ['FICHADO'], { barra: 'PRESSURES', board: 80 })
    expect(text.startsWith('Final del que lo trajo.')).toBe(true)
    expect(text.length).toBeGreaterThan('Final del que lo trajo.'.length)
  })
  it('al cerrar la historia el desenlace guardado ya trae el camino y el estado del club', () => {
    const arcs = { active: { id: 'pibe', chapter: 3, delivered: true, wait: 0, flags: ['PERDIDO'] }, cooldown: 0, done: [] }
    const r = resolveChapter(arcs, 'ARC_PIBE_3', 'B', 2026, { barra: 'INVASION', board: 40, favors: 0 })
    expect(r.finished.ending).toMatch(/barra/i)
    const sinContexto = resolveChapter(arcs, 'ARC_PIBE_3', 'B', 2026)
    expect(sinContexto.finished.ending).not.toMatch(/barra/i)
  })
  it('las variantes del catálogo apuntan a marcas que existen en capítulos anteriores y traen texto', () => {
    let withVariants = 0
    for (const arc of ARC_CATALOG) {
      const earlier = new Set(arc.chapters.slice(0, -1).flatMap(c => c.options.map(o => o.flag)))
      for (const o of arc.chapters[arc.chapters.length - 1].options) {
        for (const v of o.variants || []) {
          withVariants++
          expect(earlier.has(v.if)).toBe(true)
          expect(v.ending.length).toBeGreaterThan(20)
        }
      }
    }
    expect(withVariants).toBeGreaterThanOrEqual(12)
  })
})
