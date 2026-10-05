import { streaksFromResults, resultFor, weeklyMoraleDelta } from '../../src/domain/streaks'

describe('rachas de resultados', () => {
  it('cuenta hacia atrás desde el último partido', () => {
    expect(streaksFromResults(['L', 'W', 'W', 'W'])).toEqual({ win: 3, loss: 0, unbeaten: 4 - 1, winless: 0 })
    expect(streaksFromResults(['W', 'D', 'L', 'L'])).toEqual({ win: 0, loss: 2, unbeaten: 0, winless: 3 })
    expect(streaksFromResults(['W', 'W', 'D'])).toEqual({ win: 0, loss: 0, unbeaten: 3, winless: 1 })
  })

  it('sin partidos no hay rachas', () => {
    expect(streaksFromResults([])).toEqual({ win: 0, loss: 0, unbeaten: 0, winless: 0 })
  })

  it('resultado desde la vista del club', () => {
    const f = { home_club_id: 'a', away_club_id: 'b', home_score: 2, away_score: 1 }
    expect(resultFor(f, 'a')).toBe('W')
    expect(resultFor(f, 'b')).toBe('L')
    expect(resultFor({ ...f, away_score: 2 }, 'a')).toBe('D')
    expect(resultFor({ ...f, home_score: null }, 'a')).toBeNull()
    expect(resultFor(f, 'z')).toBeNull()
  })
})

describe('moral semanal', () => {
  it('sin rachas vuelve despacio hacia 60 en vez de caer siempre', () => {
    expect(weeklyMoraleDelta(24, {})).toBe(1)
    expect(weeklyMoraleDelta(90, {})).toBe(-1)
    expect(weeklyMoraleDelta(60, {})).toBe(0)
  })

  it('las rachas reales empujan', () => {
    expect(weeklyMoraleDelta(60, { win: 3 })).toBe(5)
    expect(weeklyMoraleDelta(60, { win: 1 })).toBe(2)
    expect(weeklyMoraleDelta(60, { loss: 3 })).toBe(-8)
    expect(weeklyMoraleDelta(70, { loss: 1 })).toBe(-4)
  })
})
