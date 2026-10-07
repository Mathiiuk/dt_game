import {
  seasonEndDate, contractEndFor, weeksBetween, yearsRemaining,
  isContractExpiringSoon, pickInitialContractYears
} from '../../src/domain/contracts'

describe('dominio de contratos', () => {
  it('el cierre de temporada es el próximo 30 de junio', () => {
    expect(seasonEndDate('2026-07-01')).toBe('2027-06-30')
    expect(seasonEndDate('2026-08-15')).toBe('2027-06-30')
    expect(seasonEndDate('2027-01-10')).toBe('2027-06-30')
    expect(seasonEndDate('2027-06-30')).toBe('2027-06-30')
  })

  it('calcula el vencimiento de contratos de N temporadas', () => {
    expect(contractEndFor('2026-08-15', 1)).toBe('2027-06-30')
    expect(contractEndFor('2026-08-15', 3)).toBe('2029-06-30')
  })

  it('B3: un contrato de 1 año en pretemporada NO está por vencer; a 6 meses sí', () => {
    expect(isContractExpiringSoon('2027-06-30', '2026-08-15')).toBe(false)
    expect(isContractExpiringSoon('2027-06-30', '2026-12-30')).toBe(true)
    expect(isContractExpiringSoon('2027-06-30', '2027-07-05')).toBe(false)
    expect(isContractExpiringSoon(null, '2026-08-15')).toBe(false)
  })

  it('calcula semanas y años restantes', () => {
    expect(weeksBetween('2026-08-15', '2026-08-22')).toBe(1)
    expect(yearsRemaining('2027-06-30', '2026-08-15')).toBe(1)
    expect(yearsRemaining('2029-06-30', '2026-08-15')).toBe(3)
    expect(yearsRemaining('2026-06-30', '2026-08-15')).toBe(0)
  })

  it('sortea años iniciales con la distribución ponderada', () => {
    expect(pickInitialContractYears(() => 0)).toBe(1)
    expect(pickInitialContractYears(() => 0.999)).toBe(5)
    let seed = 1
    const lcg = () => (seed = (seed * 48271) % 2147483647) / 2147483647
    const counts = {}
    for (let i = 0; i < 20000; i++) { const y = pickInitialContractYears(lcg); counts[y] = (counts[y] || 0) + 1 }
    expect(counts[1] / 20000).toBeGreaterThan(0.17)
    expect(counts[1] / 20000).toBeLessThan(0.23)
    expect(counts[3] / 20000).toBeGreaterThan(0.27)
    expect(counts[3] / 20000).toBeLessThan(0.33)
  })
})

import { contractsAlert } from '../../src/domain/contracts'

describe('alerta de contratos por vencer', () => {
  const squad = [
    { contract_end: '2027-06-30' }, { contract_end: '2027-06-30' }, { contract_end: '2028-06-30' }
  ]
  it('no hay alerta si no vence nada en la ventana', () => {
    expect(contractsAlert(squad, '2026-08-05')).toBeNull()
  })
  it('a mitad de temporada es un aviso suave', () => {
    const a = contractsAlert(squad, '2027-01-06')
    expect(a).toMatchObject({ priority: 'LOW', count: 2 })
  })
  it('en las últimas 12 semanas es urgente y dice cuántas faltan', () => {
    const a = contractsAlert(squad, '2027-04-14')
    expect(a.priority).toBe('HIGH')
    expect(a.count).toBe(2)
    expect(a.message).toMatch(/2 jugadores quedan libres/)
    expect(a.message).toMatch(/11 semanas/)
  })
  it('los que vencen el año siguiente no cuentan para la urgencia de esta temporada', () => {
    expect(contractsAlert([{ contract_end: '2028-06-30' }], '2027-04-14')).toBeNull()
  })
})
