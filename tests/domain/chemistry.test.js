import {
  personalityFit, linkStrength, neighborPairs, teamChemistry, chemistryFactor, weakestLinks
} from '../../src/domain/chemistry'
import { getLayout } from '../../src/domain/formations'

const P = (id, position, extra = {}) => ({ id, position, nationality: 'Argentina', matches_played: 20, ...extra })

describe('personalidades', () => {
  it('se complementan, chocan o son neutras, sin importar el orden', () => {
    expect(personalityFit('NATURAL_LEADER', 'FRAGILE')).toBe(1)
    expect(personalityFit('FRAGILE', 'NATURAL_LEADER')).toBe(1)
    expect(personalityFit('TEMPERAMENTAL', 'AMBITIOUS')).toBe(-1)
    expect(personalityFit('SLACKER', 'FRAGILE')).toBe(0)
    expect(personalityFit(null, 'FRAGILE')).toBe(0)
  })
})

describe('enlace entre dos jugadores', () => {
  const a = P('a', 'DFC')
  const b = P('b', 'DFC')

  it('dos compañeros de siempre, de la misma nacionalidad y en su puesto, tienen química alta', () => {
    const l = linkStrength(a, 'DFC1', b, 'DFC2')
    expect(l.strength).toBe(3)
    expect(l.tone).toBe('GOOD')
    expect(l.reasons).toEqual(expect.arrayContaining(['misma nacionalidad', 'mucho tiempo juntos en el club', 'los dos en su puesto']))
  })

  it('un recién llegado de otra nacionalidad que juega fuera de puesto la baja a rojo', () => {
    const l = linkStrength(a, 'DFC1', P('c', 'DC', { nationality: 'Uruguay', matches_played: 0 }), 'DFC2')
    expect(l.tone).toBe('BAD')
    expect(l.strength).toBeLessThan(1)
    expect(l.reasons).toEqual(expect.arrayContaining(['todavía no se conocen', 'alguno juega fuera de puesto']))
  })

  it('una mentoría activa suma mucho, en cualquier orden', () => {
    const x = P('x', 'MC', { matches_played: 5 })
    const y = P('y', 'PO', { nationality: 'Chile', matches_played: 5 })
    const base = linkStrength(x, 'MC1', y, 'MC2')
    const mentored = linkStrength(x, 'MC1', y, 'MC2', { mentorPairs: new Set(['x|y']) })
    const reversed = linkStrength(y, 'MC2', x, 'MC1', { mentorPairs: new Set(['x|y']) })
    expect(base.strength).toBe(0.5)
    expect(mentored.strength - base.strength).toBe(1.5)
    expect(reversed.reasons).toContain('mentoría en marcha')
  })

  it('la personalidad suma o resta', () => {
    const good = linkStrength({ ...a, archetype: 'NATURAL_LEADER' }, 'DFC1', { ...b, archetype: 'FRAGILE' }, 'DFC2')
    const bad = linkStrength({ ...a, archetype: 'TEMPERAMENTAL' }, 'DFC1', { ...b, archetype: 'TEMPERAMENTAL' }, 'DFC2')
    expect(good.reasons).toContain('personalidades que se complementan')
    expect(bad.reasons).toContain('personalidades que chocan')
    expect(good.strength).toBeGreaterThan(bad.strength)
  })

  it('el valor siempre queda entre 0 y 3', () => {
    const worst = linkStrength(P('a', 'PO', { nationality: 'X', matches_played: 0, archetype: 'SLACKER' }), 'DC', P('b', 'DC', { nationality: 'Y', matches_played: 0, archetype: 'SLACKER' }), 'PO')
    expect(worst.strength).toBeGreaterThanOrEqual(0)
    expect(linkStrength(a, 'DFC1', b, 'DFC2', { mentorPairs: new Set(['a|b']) }).strength).toBe(3)
  })
})

describe('vecinos en la cancha', () => {
  it('cada ficha se une con las más cercanas, sin repetir pares', () => {
    const layout = getLayout('4-4-2')
    const pairs = neighborPairs(layout)
    const keys = pairs.map(p => [...p].sort().join('|'))
    expect(new Set(keys).size).toBe(keys.length)
    expect(pairs.length).toBeGreaterThanOrEqual(11)
    const gk = pairs.filter(p => p.includes('PO'))
    expect(gk.length).toBeGreaterThan(0)
    // el arquero no se une con los delanteros
    expect(pairs.some(p => p.includes('PO') && p.some(s => s.startsWith('DC')))).toBe(false)
  })

  it('no une a jugadores muy lejanos', () => {
    const layout = [{ slot: 'A', x: 10, y: 10 }, { slot: 'B', x: 12, y: 12 }, { slot: 'C', x: 90, y: 95 }]
    const pairs = neighborPairs(layout).map(p => [...p].sort().join('|'))
    expect(pairs).toEqual(['A|B'])
  })
})

describe('química del equipo', () => {
  const layout = getLayout('4-4-2')
  const positions = { PO: 'PO', LI: 'LI', DFC1: 'DFC', DFC2: 'DFC', LD: 'LD', MI: 'MI', MC1: 'MC', MC2: 'MC', MD: 'MD', DC1: 'DC', DC2: 'DC' }
  const players = layout.map(({ slot }) => P(`p-${slot}`, positions[slot]))
  const lineup = Object.fromEntries(layout.map(({ slot }) => [slot, `p-${slot}`]))

  it('un once de compañeros en su puesto tiene química máxima y suma un 3%', () => {
    const chem = teamChemistry(layout, lineup, players)
    expect(chem.score).toBe(100)
    expect(chem.factor).toBe(1.03)
    expect(chem.links.every(l => l.tone === 'GOOD')).toBe(true)
  })

  it('poner a todos fuera de puesto y de otras nacionalidades la hunde y resta', () => {
    const wrong = layout.map(({ slot }, i) => P(`p-${slot}`, 'PO', { nationality: `N${i}`, matches_played: 1 }))
    const chem = teamChemistry(layout, lineup, wrong.map((p, i) => (i === 0 ? { ...p, position: 'PO' } : p)))
    expect(chem.score).toBeLessThan(50)
    expect(chem.factor).toBeLessThan(1)
  })

  it('los puestos vacíos no generan enlaces', () => {
    const chem = teamChemistry(layout, { PO: 'p-PO' }, players)
    expect(chem.links).toEqual([])
    expect(chem.factor).toBe(1)
  })

  it('devuelve la química de cada ficha y los enlaces más débiles', () => {
    const mix = players.map(p => (p.id === 'p-MC1' ? { ...p, nationality: 'Brasil', matches_played: 0 } : p))
    const chem = teamChemistry(layout, lineup, mix)
    expect(chem.slotChemistry.MC1).toBeLessThan(chem.slotChemistry.DFC1)
    const weak = weakestLinks(chem.links, 2)
    expect(weak).toHaveLength(2)
    expect(weak[0].strength).toBeLessThanOrEqual(weak[1].strength)
  })

  it('el factor va de -3% a +3% y 1,5 de media no cambia nada', () => {
    expect(chemistryFactor(0)).toBe(0.97)
    expect(chemistryFactor(3)).toBe(1.03)
    expect(chemistryFactor(1.5)).toBe(1)
    expect(chemistryFactor(9)).toBe(1.03)
  })
})
