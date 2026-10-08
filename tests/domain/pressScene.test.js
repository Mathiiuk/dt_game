import { describe, it, expect } from 'vitest'
import { reporterOf, roomFace, nextRoomMood, lightningRound, lightningTotal } from '../../src/domain/pressScene'

describe('escena de la sala de prensa', () => {
  it('cada periodista tiene siempre el mismo carácter', () => {
    const a = reporterOf('Esteban Valenzuela')
    expect(a).toEqual(reporterOf('Esteban Valenzuela'))
    expect(['AMABLE', 'PICANTE', 'CHISMOSO']).toContain(a.mood)
    expect(a.intro.length).toBeGreaterThan(5)
  })

  it('la cara de la sala acompaña cómo cayó la respuesta', () => {
    expect(roomFace({ fans: 1, board: 1 }).label).toBe('Aplausos')
    expect(roomFace({ fans: 0, board: 0 }).label).toBe('Silencio')
    expect(roomFace({ fans: -1, board: -1 }).label).toBe('Abucheo')
  })

  it('el humor de la sala se mueve pero nunca se sale de 0 a 100', () => {
    expect(nextRoomMood(50, { fans: 1, board: 1 })).toBeGreaterThan(50)
    expect(nextRoomMood(95, { fans: 1, board: 1 })).toBe(100)
    expect(nextRoomMood(5, { fans: -1, board: -1 })).toBe(0)
  })

  it('la ronda relámpago trae tres preguntas distintas y el total se acota', () => {
    const round = lightningRound(() => 0.3)
    expect(round).toHaveLength(3)
    expect(new Set(round.map(r => r.prompt)).size).toBe(3)
    expect(lightningTotal([{ fans: 1 }, { fans: 1 }, { fans: 1 }])).toBe(2)
    expect(lightningTotal([{ fans: -1 }, { fans: -1 }, { fans: -1 }])).toBe(-2)
    expect(lightningTotal([])).toBe(0)
  })
})
