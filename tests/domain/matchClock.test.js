import { MATCH_SPEEDS, msPerMinute, matchSeconds, clockRuns, DEFAULT_SPEED } from '../../src/domain/matchClock'

describe('reloj del partido', () => {
  it('x1 es lento y legible y x2 es la velocidad que antes era la normal (ya no hay x4)', () => {
    expect(MATCH_SPEEDS.map(s => s.label)).toEqual(['x1', 'x2'])
    expect(MATCH_SPEEDS.some(s => s.id === 4)).toBe(false)
    expect(msPerMinute(1)).toBeGreaterThan(msPerMinute(2))
    // Antes el partido entero duraba 4,5 segundos a la velocidad normal: x1 tiene que poder leerse
    expect(matchSeconds(1)).toBeGreaterThanOrEqual(45)
    expect(matchSeconds(1)).toBeLessThanOrEqual(90)
    expect(msPerMinute(2)).toBeGreaterThan(50)
  })

  it('arranca en la velocidad lenta y una velocidad desconocida usa esa misma', () => {
    expect(DEFAULT_SPEED).toBe(1)
    expect(msPerMinute(99)).toBe(msPerMinute(1))
    // Una velocidad guardada de antes (x4) cae en la lenta
    expect(msPerMinute(4)).toBe(msPerMinute(1))
  })

  it('el reloj corre solo con el partido en juego, sin pausa y antes del minuto 90', () => {
    expect(clockRuns({ active: true, paused: false, minute: 10 })).toBe(true)
    expect(clockRuns({ active: true, paused: true, minute: 10 })).toBe(false)
    expect(clockRuns({ active: false, paused: false, minute: 10 })).toBe(false)
    expect(clockRuns({ active: true, paused: false, minute: 90 })).toBe(false)
  })
})
