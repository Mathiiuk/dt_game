import { speedBonus, yesterdayOf } from '../../src/domain/dailyTimer'

describe('contrarreloj del reto del día', () => {
  it('hasta 30 segundos el bonus es de 10 puntos y queda lo que falta', () => {
    expect(speedBonus(0)).toEqual({ bonus: 10, remaining: 30 })
    expect(speedBonus(20)).toEqual({ bonus: 10, remaining: 10 })
    expect(speedBonus(30)).toEqual({ bonus: 10, remaining: 0 })
  })

  it('entre 31 y 60 segundos el bonus baja a 5', () => {
    expect(speedBonus(31)).toEqual({ bonus: 5, remaining: 29 })
    expect(speedBonus(60)).toEqual({ bonus: 5, remaining: 0 })
  })

  it('pasado el minuto no hay bonus', () => {
    expect(speedBonus(61)).toEqual({ bonus: 0, remaining: 0 })
    expect(speedBonus(5000)).toEqual({ bonus: 0, remaining: 0 })
  })

  it('un valor raro cuenta como recién empezado', () => {
    expect(speedBonus(undefined)).toEqual({ bonus: 10, remaining: 30 })
    expect(speedBonus(-4)).toEqual({ bonus: 10, remaining: 30 })
    expect(speedBonus('x')).toEqual({ bonus: 10, remaining: 30 })
  })

  it('el día de ayer cruza fin de mes y de año', () => {
    expect(yesterdayOf('2026-10-12')).toBe('2026-10-11')
    expect(yesterdayOf('2026-03-01')).toBe('2026-02-28')
    expect(yesterdayOf('2026-01-01')).toBe('2025-12-31')
    expect(yesterdayOf('2028-03-01')).toBe('2028-02-29')
  })

  it('un día inválido devuelve null', () => {
    expect(yesterdayOf('mañana')).toBeNull()
    expect(yesterdayOf(undefined)).toBeNull()
  })
})
