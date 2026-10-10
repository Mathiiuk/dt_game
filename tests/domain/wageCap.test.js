import { describe, it, expect } from 'vitest'
import { DEFAULT_WAGE_CAP, wageCapOf, payroll, wageCapStatus, balanceCheck } from '../../src/domain/finances'

describe('tope de sueldos de la dirigencia', () => {
  it('el tope es el del club o 3500 si no tiene', () => {
    expect(wageCapOf({ wage_budget: 4200 })).toBe(4200)
    expect(wageCapOf({})).toBe(DEFAULT_WAGE_CAP)
    expect(wageCapOf(null)).toBe(3500)
  })

  it('la masa salarial suma jugadores (contract_salary) y cuerpo técnico', () => {
    const p = payroll({ players: [{ contract_salary: 500 }, { contract_salary: 700 }, {}], staff: [{ wage_weekly: 120 }, { salary: 80 }] })
    expect(p).toEqual({ playerWages: 1700, staffWages: 200, total: 1900 })
  })

  it('dentro del tope: verde, con margen', () => {
    const s = wageCapStatus(2000, 3500)
    expect(s).toMatchObject({ tone: 'accent', over: false, margin: 1500, percent: 57, barValue: 57 })
  })

  it('cerca del tope (más de 85 %): ámbar', () => {
    expect(wageCapStatus(3200, 3500).tone).toBe('warning')
  })

  it('pasado el tope: rojo, muestra cuánto se pasa y la barra queda llena', () => {
    const s = wageCapStatus(4000, 3500)
    expect(s).toMatchObject({ tone: 'danger', over: true, margin: -500, overBy: 500, barValue: 100 })
    expect(s.percent).toBe(114)
  })

  it('sin tope válido usa el de por defecto', () => {
    expect(wageCapStatus(1000, 0).cap).toBe(3500)
  })
})

describe('verificar el balance', () => {
  it('cuadra cuando la caja es el último saldo del libro', () => {
    expect(balanceCheck(1000, 1000)).toMatchObject({ status: 'OK', drift: 0 })
    expect(balanceCheck(1000.4, 1000)).toMatchObject({ status: 'OK' })
  })

  it('si difiere, dice cuánto y de qué lado', () => {
    const a = balanceCheck(1500, 1000)
    expect(a).toMatchObject({ status: 'DRIFT', drift: 500 })
    expect(a.message).toMatch(/\$?500/)
    expect(a.message).toMatch(/más/i)
    const b = balanceCheck(800, 1000)
    expect(b).toMatchObject({ status: 'DRIFT', drift: -200 })
    expect(b.message).toMatch(/menos/i)
  })

  it('sin movimientos en el libro no hay con qué comparar', () => {
    expect(balanceCheck(1000, null)).toMatchObject({ status: 'EMPTY' })
  })
})
