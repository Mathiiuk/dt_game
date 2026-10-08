import { describe, it, expect } from 'vitest'
import {
  getPositionColorTheme,
  getMarketHierarchyTag,
  getMarketPlayerTrait,
  compareWithStarter,
  calculateSigningImpact,
  getRepresentativeProfile
} from '../../src/domain/market'

describe('dominio arcade del mercado (Panini y negociación)', () => {
  it('asigna paleta de color arcade según la posición', () => {
    expect(getPositionColorTheme('GK').key).toBe('emerald')
    expect(getPositionColorTheme('PO').key).toBe('emerald')
    expect(getPositionColorTheme('DFC').key).toBe('sky')
    expect(getPositionColorTheme('LI').key).toBe('sky')
    expect(getPositionColorTheme('MC').key).toBe('amber')
    expect(getPositionColorTheme('MCD').key).toBe('amber')
    expect(getPositionColorTheme('DC').key).toBe('rose')
    expect(getPositionColorTheme('ST').key).toBe('rose')
  })

  it('calcula la jerarquía de la figurita (estrella, joya o ganga)', () => {
    const list = [
      { id: '1', position: 'DC', attr_overall: 78, age: 28, market_value: 80000 },
      { id: '2', position: 'DC', attr_overall: 65, age: 19, attr_potential: 82, market_value: 25000 },
      { id: '3', position: 'DC', attr_overall: 60, age: 25, market_value: 8000 }
    ]
    expect(getMarketHierarchyTag(list[0], list)?.label).toBe('Estrella')
    expect(getMarketHierarchyTag(list[1], list)?.label).toBe('Joya')
    expect(getMarketHierarchyTag(list[2], list)?.label).toBe('Ganga')
  })

  it('asigna un rasgo de personalidad cómico y memorable por jugador', () => {
    const fast = { attr_pace: 85, age: 24 }
    const veteran = { attr_pace: 50, age: 34 }
    expect(getMarketPlayerTrait(fast).icon).toBe('Zap')
    expect(getMarketPlayerTrait(veteran).icon).toBe('Crown')
  })

  it('compara el jugador con el titular actual del plantel', () => {
    const ownSquad = [
      { position: 'DC', attr_overall: 64, last_name: 'Morales' },
      { position: 'GK', attr_overall: 58, last_name: 'Gómez' }
    ]

    const betterDc = { position: 'DC', attr_overall: 68 }
    const equalDc = { position: 'DC', attr_overall: 64 }
    const worseDc = { position: 'DC', attr_overall: 60 }
    const noPosition = { position: 'DFC', attr_overall: 62 }

    const compBetter = compareWithStarter(betterDc, ownSquad)
    expect(compBetter.status).toBe('improves')
    expect(compBetter.text).toContain('+4 vs Morales')

    const compEqual = compareWithStarter(equalDc, ownSquad)
    expect(compEqual.status).toBe('rotates')
    expect(compEqual.text).toContain('a la par')

    const compWorse = compareWithStarter(worseDc, ownSquad)
    expect(compWorse.status).toBe('below')
    expect(compWorse.text).toContain('-4 vs Morales')

    const compUncovered = compareWithStarter(noPosition, ownSquad)
    expect(compUncovered.status).toBe('uncovered')
    expect(compUncovered.text).toContain('sin titular')
  })

  it('calcula el impacto económico del fichaje en caja y masa salarial', () => {
    const impact = calculateSigningImpact({
      fee: 10000,
      budget: 25000,
      weeklyWage: 1200,
      currentPayroll: 8000,
      wageBudgetWeekly: 10000
    })

    expect(impact.cashLeft).toBe(15000)
    expect(impact.newPayroll).toBe(9200)
    expect(impact.wageMarginLeft).toBe(800)
    expect(impact.isTight).toBe(false)

    // Caso ajustado en caja
    const tight = calculateSigningImpact({
      fee: 24000,
      budget: 25000,
      weeklyWage: 1000,
      currentPayroll: 5000,
      wageBudgetWeekly: 10000
    })
    expect(tight.isTight).toBe(true)
  })

  it('asigna un representante con nombre, avatar y frase con chispa', () => {
    const rep = getRepresentativeProfile({ id: 'p1', last_name: 'Gómez', market_value: 15000 })
    expect(rep.name).toBeDefined()
    expect(rep.avatar).toBeDefined()
    expect(rep.openingQuote).toBeDefined()
  })
})
