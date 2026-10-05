import { formatGameDate, formatLongDate, daysBetween, formatMoney } from '../../src/lib/format'

describe('formato de fechas del juego', () => {
  it('no se desfasa un día por la zona horaria', () => {
    expect(formatGameDate('2026-08-12')).toMatch(/12/)
    expect(formatGameDate('2026-08-12')).toMatch(/ago/i)
    expect(formatLongDate('2026-07-01')).toMatch(/1 de julio/i)
    // acepta timestamps ISO con hora (usa sólo la parte de fecha)
    expect(formatGameDate('2026-08-12T23:30:00Z')).toBe(formatGameDate('2026-08-12'))
  })

  it('devuelve vacío sin fecha', () => {
    expect(formatGameDate(null)).toBe('')
    expect(formatLongDate(undefined)).toBe('')
  })

  it('calcula días entre fechas', () => {
    expect(daysBetween('2026-08-01', '2026-08-15')).toBe(14)
    expect(daysBetween('2026-08-15', '2026-08-01')).toBe(-14)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
  })
})

describe('formato de dinero', () => {
  it('usa separador de miles es-AR y signo delante en negativos', () => {
    expect(formatMoney(94916)).toBe('$94.916')
    expect(formatMoney(-1200)).toBe('-$1.200')
    expect(formatMoney(0)).toBe('$0')
    expect(formatMoney(undefined)).toBe('$0')
  })
})
