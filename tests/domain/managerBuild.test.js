import { changePoint, remainingPoints, finalValue, spentPoints } from '../../src/domain/managerBuild'

const base = { tactics: 10, motivation: 5 }

describe('reparto de puntos del DT', () => {
  it('calcula puntos gastados, libres y valor final', () => {
    const d = { tactics: 3, motivation: 4 }
    expect(spentPoints(d)).toBe(7)
    expect(remainingPoints(d, 15)).toBe(8)
    expect(finalValue(base, d, 'tactics')).toBe(13)
    expect(finalValue(base, {}, 'youth')).toBe(5)
  })

  it('suma un punto si hay libres y no supera el tope inicial', () => {
    const r = changePoint({ distributed: { tactics: 1 }, baseAttributes: base, key: 'tactics', change: 1, pool: 15, cap: 14 })
    expect(r).toEqual({ ok: true, distributed: { tactics: 2 } })
  })

  it('rechaza sumar sin puntos libres o por encima del tope', () => {
    expect(changePoint({ distributed: { tactics: 4 }, baseAttributes: base, key: 'tactics', change: 1, pool: 15, cap: 14 })).toEqual({ ok: false, reason: 'CAP' })
    expect(changePoint({ distributed: { motivation: 5, tactics: 0 }, baseAttributes: base, key: 'tactics', change: 1, pool: 5, cap: 14 })).toEqual({ ok: false, reason: 'NO_POINTS' })
  })

  it('no permite bajar de cero', () => {
    expect(changePoint({ distributed: { tactics: 0 }, baseAttributes: base, key: 'tactics', change: -1, pool: 15, cap: 14 })).toEqual({ ok: false, reason: 'MIN' })
  })
})
