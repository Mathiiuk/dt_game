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
