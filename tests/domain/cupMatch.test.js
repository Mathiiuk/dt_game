import { simulateCupScore, seededRandom, clubStrength } from '../../src/domain/cupMatch'

describe('resultado de partido de copa', () => {
  it('es determinista por partido (no se puede volver a tirar)', () => {
    const a = simulateCupScore({ fixtureId: 'f1', homeStrength: 60, awayStrength: 55 })
    const b = simulateCupScore({ fixtureId: 'f1', homeStrength: 60, awayStrength: 55 })
    expect(a).toEqual(b)
    expect(seededRandom('x')()).toBe(seededRandom('x')())
  })

  it('nunca termina empatado', () => {
    for (let i = 0; i < 300; i++) {
      const { homeScore, awayScore } = simulateCupScore({ fixtureId: `f${i}`, homeStrength: 55, awayStrength: 55 })
      expect(homeScore).not.toBe(awayScore)
    }
  })

  it('el equipo más fuerte gana bastante más seguido', () => {
    let strongWins = 0
    for (let i = 0; i < 400; i++) {
      const { homeScore, awayScore } = simulateCupScore({ fixtureId: `g${i}`, homeStrength: 45, awayStrength: 70 })
      if (awayScore > homeScore) strongWins++
    }
    expect(strongWins).toBeGreaterThan(280)
  })

  it('la fuerza del club es la media de los 11 mejores', () => {
    const players = Array.from({ length: 15 }, (_, i) => ({ attr_overall: 50 + i }))
    expect(clubStrength(players)).toBe(59) // 64..54
    expect(clubStrength([])).toBe(50)
  })
})
