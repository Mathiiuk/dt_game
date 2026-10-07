vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { calculateXpForLevel, getHonorificTitle } from '../../src/api/levels'
import { zoneOf } from '../../src/domain/standings'

describe('niveles del DT', () => {
  it('la curva de XP es estrictamente creciente y arranca en 0', () => {
    expect(calculateXpForLevel(1)).toBe(0)
    let prev = 0
    for (let lvl = 2; lvl <= 50; lvl++) {
      const xp = calculateXpForLevel(lvl)
      expect(xp).toBeGreaterThan(prev)
      prev = xp
    }
    expect(calculateXpForLevel(2)).toBe(150)
  })

  it('asigna el título honorífico por tramo de nivel', () => {
    expect(getHonorificTitle(1)).toBe('DT de Potrero')
    expect(getHonorificTitle(6)).toBe('DT Regional Promesa')
    expect(getHonorificTitle(45)).toBe('Leyenda Suprema del Banco')
  })
})

describe('zonas de la tabla', () => {
  it('clasifica ascenso, zona media y descenso en una división intermedia (sin reducido)', () => {
    expect(zoneOf(1, 20, 3).id).toBe('PROMOTION')
    expect(zoneOf(2, 20, 3).id).toBe('PROMOTION')
    expect(zoneOf(4, 20, 3).id).toBe('NONE')
    expect(zoneOf(10, 20, 3).id).toBe('NONE')
    expect(zoneOf(19, 20, 3).id).toBe('RELEGATION')
  })
})
