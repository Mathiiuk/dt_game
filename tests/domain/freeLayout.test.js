import {
  roleAtPoint, clampPoint, buildFreeLayout, moveToPoint, pointsFrom, shapeOf, isValidFreeLayout, normalizeLayout, slotsOfLayout, FREE_FORMATION
} from '../../src/domain/freeLayout'
import { FORMATION_LAYOUTS, getLayout } from '../../src/domain/formations'

describe('puesto según la zona de la cancha', () => {
  it('reconoce arquero, defensa, medio y ataque', () => {
    expect(roleAtPoint(50, 91)).toBe('PO')
    expect(roleAtPoint(14, 72)).toBe('LI')
    expect(roleAtPoint(86, 72)).toBe('LD')
    expect(roleAtPoint(50, 75)).toBe('DFC')
    expect(roleAtPoint(50, 57)).toBe('MCD')
    expect(roleAtPoint(40, 50)).toBe('MC')
    expect(roleAtPoint(50, 36)).toBe('MCO')
    expect(roleAtPoint(14, 48)).toBe('MI')
    expect(roleAtPoint(86, 40)).toBe('MD')
    expect(roleAtPoint(16, 22)).toBe('EI')
    expect(roleAtPoint(84, 22)).toBe('ED')
    expect(roleAtPoint(50, 15)).toBe('DC')
  })

  it('las formaciones clásicas se leen igual que su definición (salvo los carrileros)', () => {
    for (const key of ['4-4-2', '4-3-3', '4-2-3-1', '5-3-2']) {
      for (const { slot, x, y } of getLayout(key)) {
        expect(roleAtPoint(x, y)).toBe(slot.replace(/\d+$/, ''))
      }
    }
  })
})

describe('límites de la cancha', () => {
  it('el arquero se queda en su área y los demás no entran', () => {
    expect(clampPoint(50, 40, true)).toEqual({ x: 50, y: 86 })
    expect(clampPoint(10, 92, true).x).toBe(30)
    expect(clampPoint(50, 95, false).y).toBe(84)
    expect(clampPoint(-20, 200, false)).toEqual({ x: 4, y: 84 })
    expect(clampPoint(120, -5, false)).toEqual({ x: 96, y: 5 })
  })
})

describe('armado del layout libre', () => {
  const base = getLayout('4-4-2')
  const lineup = Object.fromEntries(base.map((p, i) => [p.slot, `p${i}`]))

  it('rearmar un 4-4-2 sin moverlo conserva puestos, orden y jugadores', () => {
    const { layout, lineup: next } = buildFreeLayout(pointsFrom(base, lineup))
    expect(new Set(slotsOfLayout(layout))).toEqual(new Set(slotsOfLayout(base)))
    expect(next).toEqual(lineup)
    expect(layout[0].slot).toBe('PO')
  })

  it('numera los puestos repetidos de izquierda a derecha', () => {
    const { layout } = buildFreeLayout(pointsFrom(base, lineup))
    const dfc = layout.filter(p => p.slot.startsWith('DFC')).sort((a, b) => a.x - b.x)
    expect(dfc.map(p => p.slot)).toEqual(['DFC1', 'DFC2'])
  })

  it('mover un mediocampista a la punta lo convierte en delantero y el jugador viaja con la ficha', () => {
    const moved = moveToPoint(base, lineup, 'MC1', 50, 12)
    expect(moved.slot).toMatch(/^DC/)
    expect(moved.lineup[moved.slot]).toBe(lineup.MC1)
    expect(shapeOf(moved.layout)).toBe('4-3-3')
    expect(isValidFreeLayout(moved.layout)).toBe(true)
    expect(new Set(Object.values(moved.lineup)).size).toBe(11)
  })

  it('el arquero no puede salir de su área ni nadie más entrar', () => {
    const keeper = moveToPoint(base, lineup, 'PO', 50, 30)
    expect(keeper.layout.find(p => p.slot === 'PO').y).toBe(86)
    const intruder = moveToPoint(base, lineup, 'DFC1', 50, 95)
    expect(intruder.layout.filter(p => p.slot === 'PO')).toHaveLength(1)
    expect(intruder.layout.find(p => p.y === 84)).toBeTruthy()
  })

  it('mover un puesto que no existe no cambia nada', () => {
    const same = moveToPoint(base, lineup, 'XX', 10, 10)
    expect(same.layout).toBe(base)
  })

  it('una ficha vacía se puede mover igual', () => {
    const partial = { PO: 'p0' }
    const moved = moveToPoint(base, partial, 'MI', 30, 50)
    expect(Object.keys(moved.lineup)).toEqual(['PO'])
    expect(moved.layout).toHaveLength(11)
  })
})

describe('esquema y validación', () => {
  it('describe el esquema del once', () => {
    expect(shapeOf(getLayout('4-4-2'))).toBe('4-4-2')
    expect(shapeOf(getLayout('4-3-3'))).toBe('4-3-3')
    expect(shapeOf(getLayout('4-2-3-1'))).toBe('4-5-1')
    expect(shapeOf(getLayout('5-3-2'))).toBe('5-3-2')
  })

  it('valida la cantidad de jugadores, el arquero único y los puestos distintos', () => {
    const good = getLayout('4-4-2')
    expect(isValidFreeLayout(good)).toBe(true)
    expect(isValidFreeLayout(good.slice(1))).toBe(false)
    expect(isValidFreeLayout(good.map((p, i) => (i === 1 ? { ...p, slot: 'PO' } : p)))).toBe(false)
    expect(isValidFreeLayout(good.map((p, i) => (i === 1 ? { ...p, x: NaN } : p)))).toBe(false)
    expect(isValidFreeLayout(good.map((p, i) => (i === 2 ? { ...p, slot: good[1].slot } : p)))).toBe(false)
    expect(isValidFreeLayout(null)).toBe(false)
  })

  it('un layout guardado roto se descarta y el bueno se limpia', () => {
    expect(normalizeLayout('basura')).toBeNull()
    expect(normalizeLayout([{ slot: 'PO', x: 50, y: 90 }])).toBeNull()
    const saved = FORMATION_LAYOUTS['4-3-3'].map(p => ({ ...p, extra: 1 }))
    expect(normalizeLayout(saved)[0]).toEqual({ slot: 'PO', x: 50, y: 91 })
    expect(FREE_FORMATION).toBe('LIBRE')
  })
})
