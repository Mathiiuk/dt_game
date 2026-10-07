import { movementOf, tierStrengthRange, wageFactorFor, tierIncomeFactor, TOP_TIER, BOTTOM_TIER } from '../../src/domain/pyramid'

describe('pirámide de divisiones', () => {
  it('los dos primeros suben y los tres últimos bajan', () => {
    expect(movementOf(1, 5)).toBe('PROMOTED')
    expect(movementOf(2, 4)).toBe('PROMOTED')
    expect(movementOf(3, 4)).toBe('STAY')
    expect(movementOf(17, 4)).toBe('STAY')
    expect(movementOf(18, 4)).toBe('RELEGATED')
    expect(movementOf(20, 2)).toBe('RELEGATED')
  })
  it('en la categoría de arriba no se sube y en la de abajo no se baja', () => {
    expect(movementOf(1, TOP_TIER)).toBe('STAY')
    expect(movementOf(20, BOTTOM_TIER)).toBe('STAY')
  })
  it('cada categoría de arriba tiene rivales más fuertes (4 puntos por escalón, base 46 a 66 en la última)', () => {
    expect(tierStrengthRange(5)).toEqual([46, 66])
    expect(tierStrengthRange(4)).toEqual([50, 70])
    expect(tierStrengthRange(1)).toEqual([62, 82])
  })
  it('el presupuesto salarial: +80% al subir, -15% al bajar, +10% si se queda (igual que la base)', () => {
    expect(wageFactorFor('PROMOTED')).toBe(1.8)
    expect(wageFactorFor('RELEGATED')).toBe(0.85)
    expect(wageFactorFor('STAY')).toBe(1.1)
  })
})

describe('ingresos por categoría', () => {
  it('cada escalón hacia arriba suma 50% a los ingresos fijos', () => {
    expect([5, 4, 3, 2, 1].map(tierIncomeFactor)).toEqual([1, 1.5, 2, 2.5, 3])
    expect(tierIncomeFactor(undefined)).toBe(1)
  })
})
