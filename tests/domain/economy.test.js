import { ECONOMY, weeklyBudget, gateSettlement, runwayWeeks } from '../../src/domain/finances'

const starters = (n, salary) => Array.from({ length: n }, () => ({ contract_salary: salary }))

describe('economía semanal', () => {
  it('un plantel inicial deja un margen chico, no una fortuna', () => {
    const week = weeklyBudget({ club: { reputation: 15 }, players: starters(20, 120), staff: [{ wage_weekly: 150 }] })
    // Antes entraban 40.000 por semana contra ~2.700 de sueldos
    expect(week.totalIncome).toBeLessThan(2500)
    expect(week.net).toBeLessThan(500)
  })

  it('con la taquilla de un partido cada dos semanas el club gestionado queda levemente positivo', () => {
    const week = weeklyBudget({ club: { reputation: 15 }, players: starters(20, 120), staff: [{ wage_weekly: 150 }] })
    const gate = gateSettlement(900, 10)
    const expected = week.net + gate.net / 2
    expect(expected).toBeGreaterThan(0)
    expect(expected).toBeLessThan(1500)
  })

  it('fichar de más hunde el flujo semanal', () => {
    const base = weeklyBudget({ players: starters(20, 120) })
    const inflated = weeklyBudget({ players: [...starters(20, 120), ...starters(4, 600)] })
    expect(inflated.net).toBeLessThan(base.net - 2000)
  })

  it('el patrocinio crece con la reputación', () => {
    const low = weeklyBudget({ club: { reputation: 15 } }).income.sponsors
    const high = weeklyBudget({ club: { reputation: 40 } }).income.sponsors
    expect(high - low).toBe(25 * ECONOMY.sponsorPerReputation)
  })

  it('la taquilla descuenta seguridad y logística', () => {
    expect(gateSettlement(1000, 10)).toEqual({ gross: 10000, operating: 4000, net: 6000 })
    expect(gateSettlement(-5, 10).gross).toBe(0)
  })

  it('la caja normalizada alcanza para varias semanas de déficit', () => {
    expect(runwayWeeks(ECONOMY.normalizedCash, -1000)).toBe(20)
    expect(runwayWeeks(100, 50)).toBeNull()
  })
})
