import { CUP_SIZES, NATIONS, cupSizeFor, cupPlan, roundLabel, groupLetter, pickNationNames, groupFixtures, knockoutPairs, rankGroup } from '../../src/domain/friendCup'
import { sanitizeSettings, settingsSummary, botCount, DEFAULT_SETTINGS } from '../../src/domain/friendLeague'

describe('Copa Mundial de la sala: plan del torneo', () => {
  it('se juega de a 8 o 16 equipos, en grupos de 4', () => {
    expect(CUP_SIZES).toEqual([8, 16])
    expect(cupPlan(8)).toEqual({ teams: 8, groups: 2, qualifiers: 4, knockout: ['SEMI', 'FINAL'], rounds: 5 })
    expect(cupPlan(16)).toEqual({ teams: 16, groups: 4, qualifiers: 8, knockout: ['CUARTOS', 'SEMI', 'FINAL'], rounds: 6 })
  })

  it('con más de 8 DT la copa pasa a 16 equipos', () => {
    expect(cupSizeFor(6, 3)).toBe(8)
    expect(cupSizeFor(8, 8)).toBe(8)
    expect(cupSizeFor(8, 9)).toBe(16)
    expect(cupSizeFor(12, 4)).toBe(16)
    expect(cupSizeFor(undefined, 2)).toBe(16)
  })

  it('nombra cada fecha: tres de grupos y después las llaves', () => {
    expect(roundLabel(1, 16)).toBe('Fecha 1 de grupos')
    expect(roundLabel(3, 8)).toBe('Fecha 3 de grupos')
    expect(roundLabel(4, 16)).toBe('Cuartos de final')
    expect(roundLabel(4, 8)).toBe('Semifinales')
    expect(roundLabel(6, 16)).toBe('Final')
    expect(roundLabel(5, 8)).toBe('Final')
  })

  it('los grupos se llaman A, B, C, D', () => {
    expect([1, 2, 3, 4].map(groupLetter)).toEqual(['A', 'B', 'C', 'D'])
  })
})

describe('Copa Mundial: ajustes de la sala', () => {
  it('el formato por defecto es liga y no cambia nada de lo anterior', () => {
    expect(DEFAULT_SETTINGS.format).toBe('LIGA')
    expect(sanitizeSettings({}).format).toBe('LIGA')
    expect(sanitizeSettings({ teams: 10 }).teams).toBe(10)
  })

  it('la copa se acota a 8 o 16 equipos, siempre con bots y solo ida', () => {
    const s = sanitizeSettings({ format: 'COPA', teams: 11, fillBots: false, legs: 2 })
    expect(s).toMatchObject({ format: 'COPA', teams: 16, fillBots: true, legs: 1 })
    expect(sanitizeSettings({ format: 'COPA', teams: 5 }).teams).toBe(8)
    expect(sanitizeSettings({ format: 'NADA' }).format).toBe('LIGA')
  })

  it('cuenta los bots y resume la copa', () => {
    const s = sanitizeSettings({ format: 'COPA', teams: 8 })
    expect(botCount(s, 3)).toBe(5)
    expect(settingsSummary(s, 3)).toMatch(/Copa Mundial/)
    expect(settingsSummary(s, 3)).toMatch(/8 selecciones/)
  })
})

describe('Copa Mundial: selecciones bot y llaves', () => {
  it('hay selecciones de sobra, sin repetirse, y siempre las mismas para la misma sala', () => {
    expect(new Set(NATIONS).size).toBe(NATIONS.length)
    expect(NATIONS.length).toBeGreaterThanOrEqual(32)
    const a = pickNationNames('sala-1', 6)
    expect(a).toEqual(pickNationNames('sala-1', 6))
    expect(new Set(a).size).toBe(6)
    expect(pickNationNames('sala-1', 3, [a[0]])).not.toContain(a[0])
    expect(pickNationNames('x', 0)).toEqual([])
  })

  it('cada grupo juega todos contra todos en tres fechas, sin repetir rival', () => {
    const fx = groupFixtures([1, 2, 3, 4])
    expect(fx).toHaveLength(6)
    expect([1, 2, 3].map(r => fx.filter(f => f.round === r).length)).toEqual([2, 2, 2])
    const pairs = new Set(fx.map(f => [f.home, f.away].sort().join('-')))
    expect(pairs.size).toBe(6)
    for (const slot of [1, 2, 3, 4]) {
      for (const r of [1, 2, 3]) expect(fx.filter(f => f.round === r && (f.home === slot || f.away === slot))).toHaveLength(1)
    }
  })

  it('el primero de un grupo se cruza con el segundo del otro', () => {
    const q = (g) => [{ slot: g * 10 + 1 }, { slot: g * 10 + 2 }]
    expect(knockoutPairs([q(1), q(2)])).toEqual([[11, 22], [21, 12]])
    expect(knockoutPairs([q(1), q(2), q(3), q(4)])).toEqual([[11, 22], [31, 42], [21, 12], [41, 32]])
  })

  it('ordena el grupo por puntos, diferencia de gol, goles y nombre', () => {
    const rows = [
      { slot: 1, name: 'B', points: 4, gd: 1, gf: 3 }, { slot: 2, name: 'A', points: 4, gd: 1, gf: 3 },
      { slot: 3, name: 'C', points: 6, gd: -2, gf: 1 }, { slot: 4, name: 'D', points: 4, gd: 2, gf: 2 }
    ]
    expect(rankGroup(rows).map(r => r.slot)).toEqual([3, 4, 2, 1])
  })
})
