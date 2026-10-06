import { playerDemands, severanceCost, wageForOvr, DEFAULT_SEVERANCE_WEEKS } from '../../src/domain/contractDemands'

describe('pretensiones de contrato y finiquito', () => {
  // Estos valores salen de `contract_demands` en la base: si cambia una fórmula, tiene que cambiar la otra
  it('coincide con la base en puntos conocidos', () => {
    expect(playerDemands({ attr_overall: 56, age: 25, attr_potential: 56, personality: 'Normal', market_value: 6000 })).toEqual({
      expectedWage: 116, minAcceptableWage: 99, desiredRole: 'ROTATION', desiredYears: 2, suggestedReleaseClause: 18000, isAmbitious: false
    })
    expect(playerDemands({ attr_overall: 70, age: 22, attr_potential: 85, personality: 'Ambicioso', market_value: 36300 })).toEqual({
      expectedWage: 254, minAcceptableWage: 216, desiredRole: 'FIRST_TEAM', desiredYears: 3, suggestedReleaseClause: 108900, isAmbitious: true
    })
    expect(playerDemands({ attr_overall: 48, age: 33, attr_potential: 48, market_value: 3000 })).toMatchObject({
      expectedWage: 83, minAcceptableWage: 71, desiredRole: 'BACKUP', desiredYears: 1, suggestedReleaseClause: 9000
    })
    expect(playerDemands({ attr_overall: 60, age: 19, attr_potential: 80, personality: 'Estrella', market_value: 15600 })).toMatchObject({
      expectedWage: 192, minAcceptableWage: 163, desiredRole: 'PROSPECT', desiredYears: 3
    })
  })

  it('la escala es la de los planteles: un jugador de la media cobra lo que pretende', () => {
    expect(wageForOvr(56)).toBe(116)
    expect(playerDemands({ attr_overall: 56, age: 26, attr_potential: 56 }).expectedWage).toBe(wageForOvr(56))
  })

  it('el finiquito es el 65% de los sueldos que faltan hasta el vencimiento', () => {
    // 52 semanas de sueldo de $124
    expect(severanceCost({ contract_salary: 124, contract_end: '2027-06-30' }, '2026-07-01')).toBe(4191)
    expect(severanceCost({ contract_salary: 100, contract_end: '2026-07-08' }, '2026-07-01')).toBe(65)
  })

  it('sin fecha de vencimiento se calcula con media temporada, y con el contrato vencido, una semana', () => {
    expect(severanceCost({ contract_salary: 100 }, '2026-07-01')).toBe(Math.round(DEFAULT_SEVERANCE_WEEKS * 100 * 0.65))
    expect(severanceCost({ contract_salary: 100, contract_end: '2026-06-01' }, '2026-07-01')).toBe(65)
  })

  it('sin jugador no hay pretensiones', () => {
    expect(playerDemands(null)).toBeNull()
  })
})
