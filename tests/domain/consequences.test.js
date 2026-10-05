import {
  DIFFICULTY, matchConsequences, ticketPriceMood, financialSatisfaction, homeAdvantage, pressureIndex, climateState, scaleEffect
} from '../../src/domain/consequences'

describe('consecuencias de un partido', () => {
  it('tres derrotas seguidas pegan en hinchada, dirigencia y vestuario', () => {
    const r = matchConsequences({ result: 'L', isHome: true, streaks: { loss: 3 } })
    expect(r.fans).toBe(-5)
    expect(r.board).toBe(-3)
    expect(r.locker).toBe(-12)
    expect(r.notes.join(' ')).toMatch(/3 derrotas seguidas/)
  })

  it('una derrota aislada no suma castigos de racha', () => {
    const r = matchConsequences({ result: 'L', isHome: true, streaks: { loss: 1 } })
    expect(r).toMatchObject({ fans: 0, board: 0, locker: -8 })
  })

  it('la goleada en contra es un reproche público', () => {
    const r = matchConsequences({ result: 'L', isHome: true, goalDiff: -4, streaks: {} })
    expect(r.locker).toBe(-15)
    expect(r.board).toBe(-2)
  })

  it('de visitante la hinchada también reacciona, más suave', () => {
    expect(matchConsequences({ result: 'W', isHome: false }).fans).toBe(2)
    expect(matchConsequences({ result: 'L', isHome: false }).fans).toBe(-2)
  })

  it('perder el clásico duele extra', () => {
    expect(matchConsequences({ result: 'L', isHome: true, isDerby: true }).fans).toBe(-4)
  })

  it('la racha de victorias hace que todo fluya', () => {
    const r = matchConsequences({ result: 'W', isHome: true, streaks: { win: 3 } })
    expect(r).toMatchObject({ fans: 2, board: 2, locker: 8 })
  })

  it('la dificultad escala solo lo negativo', () => {
    const negative = { result: 'L', isHome: true, streaks: { loss: 3 } }
    expect(matchConsequences(negative, DIFFICULTY.REALISTIC).board).toBe(-4)
    expect(matchConsequences(negative, DIFFICULTY.RELAXED).board).toBe(-2)
    expect(scaleEffect(5, DIFFICULTY.RELAXED)).toBe(5)
  })
})

describe('precio de la entrada', () => {
  it('caro con el equipo sin ganar enoja', () => {
    expect(ticketPriceMood({ price: 18, streaks: { winless: 3 } })).toMatchObject({ fans: -6, risk: 'HIGH' })
    expect(ticketPriceMood({ price: 13, streaks: { winless: 2 } }).fans).toBeLessThan(0)
  })

  it('caro con el equipo ganando se tolera', () => {
    expect(ticketPriceMood({ price: 18, streaks: { win: 3, winless: 0 } }).fans).toBe(0)
  })

  it('barato con racha positiva suma simpatía', () => {
    expect(ticketPriceMood({ price: 6, streaks: { win: 2 } }).fans).toBe(1)
  })
})

describe('satisfacción financiera', () => {
  it('caja negativa es crítica y caja sana con superávit es alta', () => {
    expect(financialSatisfaction({ balance: -100 })).toBeLessThanOrEqual(15)
    expect(financialSatisfaction({ balance: 40000, expectedWeeklyFlow: 900 })).toBeGreaterThan(85)
  })

  it('pasarse del tope salarial resta', () => {
    const base = financialSatisfaction({ balance: 20000 })
    expect(financialSatisfaction({ balance: 20000, wageOverBudget: true })).toBe(base - 10)
  })
})

describe('clima del club', () => {
  it('la ventaja de local sigue el humor de la hinchada', () => {
    expect(homeAdvantage(100)).toBeGreaterThan(homeAdvantage(65))
    expect(homeAdvantage(0)).toBeLessThan(1.05)
    expect(homeAdvantage(65)).toBeCloseTo(1.072, 2)
  })

  it('la presión sube con la racha mala y cambia el clima', () => {
    const calm = pressureIndex({ fans: 80 })
    const hot = pressureIndex({ lossStreak: 4, objectiveGap: 1, fans: 20, balance: -1, openScandals: 2 })
    expect(climateState(calm).key).toBe('FLOWS')
    expect(hot).toBe(96)
    expect(climateState(hot).key).toBe('CHAOS')
    expect(climateState(40).key).toBe('TENSION')
    expect(climateState(60).key).toBe('CRISIS')
  })
})
