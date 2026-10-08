import { describe, it, expect } from 'vitest'
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
})
