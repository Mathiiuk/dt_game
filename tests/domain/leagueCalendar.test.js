import { firstLeagueMatchDate, weekOfDate } from '../../src/domain/gameWeek'

// La fecha de juego avanza de a 7 días desde el 1 de julio: para que "avanzar la semana" llegue justo al día del partido,
// los partidos de liga tienen que caer en el mismo día de la semana que la fecha de juego.
describe('primer partido de la liga', () => {
  const weekday = (iso) => new Date(`${iso}T00:00:00Z`).getUTCDay()

  it('cae 4 semanas justas después del 1 de julio: mismo día de la semana que la fecha de juego', () => {
    expect(firstLeagueMatchDate(2026)).toBe('2026-07-29')
    for (const year of [2026, 2027, 2028, 2029, 2030]) {
      expect(weekday(firstLeagueMatchDate(year))).toBe(weekday(`${year}-07-01`))
    }
  })

  it('es el primer día de la semana 5 de la temporada (cuando termina la pretemporada)', () => {
    expect(weekOfDate(firstLeagueMatchDate(2026))).toBe(5)
    expect(weekOfDate(firstLeagueMatchDate(2027))).toBe(5)
  })

  it('las fechas siguientes (cada 7 días) siguen cayendo en el día de juego', () => {
    const base = new Date(`${firstLeagueMatchDate(2026)}T00:00:00Z`)
    for (let round = 0; round < 38; round++) {
      const d = new Date(base.getTime() + round * 7 * 86_400_000)
      expect(d.getUTCDay()).toBe(3) // miércoles, como el 1 de julio de 2026
    }
  })
})
