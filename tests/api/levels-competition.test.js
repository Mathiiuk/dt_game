vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { calculateXpForLevel, getHonorificTitle } from '../../src/api/levels'
import { getZoneForPosition } from '../../src/api/competition'

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
  it('clasifica ascenso, playoff, zona media y descenso', () => {
    expect(getZoneForPosition(1).id).toBe('PROMOTION')
    expect(getZoneForPosition(2).id).toBe('PROMOTION')
    expect(getZoneForPosition(4).id).toBe('PLAYOFF')
    expect(getZoneForPosition(10).id).toBe('MID_TABLE')
    expect(getZoneForPosition(19).id).toBe('RELEGATION')
  })
})
