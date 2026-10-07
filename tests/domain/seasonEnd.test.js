import { isSeasonEnded } from '../../src/domain/gameWeek'

describe('fin de temporada por la fecha del juego', () => {
  it('antes de la última semana la temporada sigue', () => {
    expect(isSeasonEnded('2026-07-01')).toBe(false)
    expect(isSeasonEnded('2027-06-22')).toBe(false)
  })
  it('en la semana 52 hay que cerrar la temporada', () => {
    expect(isSeasonEnded('2027-06-23')).toBe(true)
    expect(isSeasonEnded('2027-06-30')).toBe(true)
  })
})

import { isAdvanceLocked } from '../../src/domain/gameWeek'

describe('candado del avance de semana', () => {
  const now = new Date('2026-10-07T12:00:00Z').getTime()
  it('sin candado se puede avanzar', () => {
    expect(isAdvanceLocked({ is_advancing: false }, now)).toBe(false)
  })
  it('un avance en curso (reciente) bloquea el segundo', () => {
    expect(isAdvanceLocked({ is_advancing: true, updated_at: '2026-10-07T11:59:50Z' }, now)).toBe(true)
  })
  it('un candado abandonado hace minutos (pestaña cerrada a mitad) ya no bloquea', () => {
    expect(isAdvanceLocked({ is_advancing: true, updated_at: '2026-10-07T11:50:00Z' }, now)).toBe(false)
  })
  it('si no sabemos desde cuándo, se respeta el candado', () => {
    expect(isAdvanceLocked({ is_advancing: true }, now)).toBe(true)
  })
})
