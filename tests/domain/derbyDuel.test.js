import { describe, it, expect } from 'vitest'
import { isDerby, fixtureIsDerby, buildDuel, scoreAnswer, duelOutcome, DUEL_MORALE, duelKickoffLine, JAB_TYPES, TONES, DUEL_ROUNDS, DERBY_MODULUS } from '../../src/domain/derbyDuel'

// Un generador con semilla para que las pruebas no dependan del azar
const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

describe('clásicos', () => {
  it('es estable y no depende del orden del par de clubes', () => {
    expect(isDerby('a', 'b')).toBe(isDerby('b', 'a'))
    expect(isDerby('a', 'b')).toBe(isDerby('a', 'b'))
  })

  it('un club no es clásico de sí mismo y sin datos no hay clásico', () => {
    expect(isDerby('a', 'a')).toBe(false)
    expect(isDerby(null, 'b')).toBe(false)
    expect(isDerby('a', undefined)).toBe(false)
  })

  it('en una liga de 19 rivales hay unos pocos clásicos, ni ninguno ni todos', () => {
    const rivals = Array.from({ length: 190 }, (_, i) => `rival-${i}`)
    const n = rivals.filter(r => isDerby('mi-club', r)).length
    expect(n).toBeGreaterThan(190 / DERBY_MODULUS / 2)
    expect(n).toBeLessThan(190 / DERBY_MODULUS * 2)
  })
})

describe('el partido es clásico', () => {
  const rivals = Array.from({ length: 60 }, (_, i) => `rival-${i}`)
  const derbyRival = rivals.find(r => isDerby('mi-club', r))
  const normalRival = rivals.find(r => !isDerby('mi-club', r))

  it('lo es igual de local que de visitante', () => {
    expect(fixtureIsDerby({ home_team_id: 'mi-club', away_team_id: derbyRival }, 'mi-club')).toBe(true)
    expect(fixtureIsDerby({ home_team_id: derbyRival, away_team_id: 'mi-club' }, 'mi-club')).toBe(true)
    expect(fixtureIsDerby({ home_team_id: 'mi-club', away_team_id: normalRival }, 'mi-club')).toBe(false)
  })

  it('sin partido o sin club no hay clásico', () => {
    expect(fixtureIsDerby(null, 'mi-club')).toBe(false)
    expect(fixtureIsDerby({ home_team_id: 'mi-club', away_team_id: derbyRival }, null)).toBe(false)
    expect(fixtureIsDerby({}, 'mi-club')).toBe(false)
  })
})

describe('duelo de declaraciones', () => {
  it('arma tres rondas, una de cada tipo, con las tres respuestas y el nombre del rival', () => {
    const duel = buildDuel('Huracán', seeded(7))
    expect(duel).toHaveLength(DUEL_ROUNDS)
    expect(new Set(duel.map(r => r.type))).toEqual(new Set(JAB_TYPES))
    for (const round of duel) {
      expect(round.jab).toContain('Huracán')
      expect(round.options.map(o => o.tone)).toEqual(TONES)
      expect(round.options.every(o => o.text && o.label)).toBe(true)
    }
  })

  it('cada tipo tiene una respuesta que gana, una que empata y una que cae en la trampa', () => {
    for (const type of JAB_TYPES) {
      const scores = TONES.map(t => scoreAnswer(type, t)).sort()
      expect(scores).toEqual([-1, 0, 1])
    }
    expect(scoreAnswer('PROVOKE', 'COOL')).toBe(1)
    expect(scoreAnswer('PROVOKE', 'BRAVE')).toBe(-1)
    expect(scoreAnswer('MIND_GAME', 'BRAVE')).toBe(1)
    expect(scoreAnswer('FLATTERY', 'RESPECT')).toBe(1)
    expect(scoreAnswer('NADA', 'BRAVE')).toBe(0)
  })

  it('el resultado sale de la suma de las tres rondas', () => {
    expect(duelOutcome([1, 1, 1])).toEqual({ total: 3, result: 'WIN' })
    expect(duelOutcome([1, 1, 0])).toEqual({ total: 2, result: 'WIN' })
    expect(duelOutcome([1, 0, 0])).toEqual({ total: 1, result: 'DRAW' })
    expect(duelOutcome([1, -1, 0])).toEqual({ total: 0, result: 'DRAW' })
    expect(duelOutcome([-1, -1, 0])).toEqual({ total: -2, result: 'LOSE' })
  })

  it('ganar levanta la moral, perder la baja un poco y empatar la deja igual', () => {
    expect(DUEL_MORALE.WIN).toBeGreaterThan(0)
    expect(DUEL_MORALE.DRAW).toBe(0)
    expect(DUEL_MORALE.LOSE).toBeLessThan(0)
    expect(Math.abs(DUEL_MORALE.LOSE)).toBeLessThan(DUEL_MORALE.WIN)
  })

  it('el relato recuerda cómo salió el duelo', () => {
    expect(duelKickoffLine('WIN', 'Huracán')).toMatch(/ganaste/)
    expect(duelKickoffLine('LOSE', 'Huracán')).toMatch(/Huracán ganó/)
    expect(duelKickoffLine('DRAW', 'Huracán')).toMatch(/parejas/)
  })
})
