import { describe, it, expect } from 'vitest'
import { ARC_CATALOG } from '../../src/domain/arcCatalog'
import { LEAGUE_ARCS } from '../../src/domain/arcCatalogLiga'
import { chapterTemplate } from '../../src/domain/arcs'
import { splitSegments, splitBeats, reactionFor, effectChips } from '../../src/domain/storyFlavor'

describe('cómo se cuentan las historias', () => {
  it('separa la narración de lo que dicen los personajes', () => {
    const segs = splitSegments('Un ojeador te cuenta de un zurdo. "Pará, que se lo lleva un grande", te susurra, mirando para los costados.')
    expect(segs.map(s => s.type)).toEqual(['tell', 'say', 'tell'])
    expect(segs[1].text).toBe('Pará, que se lo lleva un grande')
  })

  it('arma momentos de a dos oraciones y deja cada diálogo solo', () => {
    const beats = splitBeats('Llega el padre. Trae a un señor de saco. Pide un departamento. "Sí o sí", dice.')
    expect(beats[0]).toEqual({ type: 'tell', text: 'Llega el padre. Trae a un señor de saco.' })
    expect(beats.filter(b => b.type === 'say')).toHaveLength(1)
    expect(beats.map(b => b.text).join(' ')).toContain('Pide un departamento.')
  })

  it('un texto vacío o sin puntos igual devuelve un momento', () => {
    expect(splitBeats('Sin punto final')).toHaveLength(1)
    expect(splitBeats('')).toHaveLength(1)
  })

  it('la cargada depende de lo que más pesó y es estable para el mismo evento', () => {
    const a = reactionFor({ fans: 5, locker: -1 }, 'ev1')
    expect(a).toBe(reactionFor({ fans: 5, locker: -1 }, 'ev1'))
    expect(reactionFor({}, 'x').length).toBeGreaterThan(5)
    expect(reactionFor({ budget: -900 }, 'x')).toMatch(/caja|contador/i)
  })

  it('los chips muestran sólo lo que cambió', () => {
    expect(effectChips({ fans: 2, locker: 0, budget: -300 })).toEqual([
      { key: 'fans', label: 'Hinchada', value: 2 },
      { key: 'budget', label: 'Caja', value: -300 }
    ])
  })

  it('no pierde los signos de apertura ¡ y ¿', () => {
    const text = beatsText('¡Qué golazo! ¿Y ahora qué hacés? Hay que decidir.')
    expect(text).toContain('¡Qué golazo!')
    expect(text).toContain('¿Y ahora qué hacés?')
  })

  it('una cita a mitad de oración queda dentro de la narración, sin globo ni puntos sueltos', () => {
    const beats = splitBeats('Un tipo se presenta como "representante de futuros cracks". Pide contrato largo. Nadie le cree.')
    expect(beats.every(b => b.type === 'tell')).toBe(true)
    expect(beats[0].text).toContain('representante de futuros cracks')
    expect(beats.map(b => b.text).join(' ')).not.toMatch(/(^|\s)\.(\s|$)/)
  })

  it('una cita que es una oración entera sí es un globo, y lo que sigue pierde la coma suelta', () => {
    const segs = splitSegments('"Pará, que se lo lleva un grande", te susurra, mirando para los costados.')
    expect(segs.map(s => s.type)).toEqual(['say', 'tell'])
    expect(segs[1].text).toBe('Te susurra, mirando para los costados.')
    const afterColon = splitSegments('El ayudante avisa: "Cambiamos ya".')
    expect(afterColon.map(s => s.type)).toEqual(['tell', 'say'])
  })

  it('no corta los números con punto ni las comillas curvas', () => {
    expect(splitBeats('Cuesta $1.000 por mes. Es caro.')[0].text).toBe('Cuesta $1.000 por mes. Es caro.')
    expect(splitSegments('Dice: “Vamos arriba”.').map(s => s.type)).toEqual(['tell', 'say'])
  })

  it('no corta una oración dentro de una cita inline', () => {
    const beats = splitBeats('El cartel dice "¡Cuidado! Perro suelto" y nadie lo lee. Seguimos.')
    expect(beats[0].text).toContain('"¡Cuidado! Perro suelto" y nadie lo lee.')
  })
})

describe('textos de todas las historias', () => {
  const texts = []
  for (const arc of [...ARC_CATALOG, ...LEAGUE_ARCS]) {
    arc.chapters.forEach((_, i) => {
      const t = chapterTemplate(arc.id, i)
      if (t) texts.push({ id: `${arc.id}#${i}`, description: t.description })
    })
  }

  it('hay historias para revisar', () => { expect(texts.length).toBeGreaterThan(50) })

  it('ningún momento arranca con puntuación suelta ni queda sin cerrar', () => {
    const bad = []
    for (const { id, description } of texts) {
      for (const b of splitBeats(description)) {
        if (/^[.,;:]/.test(b.text)) bad.push(`${id}: empieza con puntuación → ${b.text.slice(0, 40)}`)
        if (b.type === 'tell' && !/[.!?…:"”»)]$/.test(b.text)) bad.push(`${id}: sin cierre → …${b.text.slice(-40)}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('no quedan marcadores {así} sin reemplazar', () => {
    const bad = texts.filter(t => /\{[A-Za-z]+\}/.test(t.description)).map(t => t.id)
    expect(bad).toEqual([])
  })

  it('el texto armado conserva todas las palabras del original', () => {
    const words = (s) => s.replace(/["“”«»]/g, '').replace(/[.,;:!?¡¿]/g, ' ').split(/\s+/).filter(Boolean).join(' ').toLowerCase()
    for (const { id, description } of texts) {
      const joined = splitBeats(description).map(b => b.text).join(' ')
      expect(words(joined), id).toBe(words(description))
    }
  })
})

function beatsText(text) { return splitBeats(text).map(b => b.text).join(' ') }
