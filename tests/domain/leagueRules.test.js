import { DEFAULT_RULES, RULESETS, rulesFor, pickBallot, botVotes, tally, pointsFor, normalizeRules, rulesetIdFor } from '../../src/domain/leagueRules'
import { roundRobinSchedule } from '../../src/domain/leagueSchedule'
import { movementOf } from '../../src/domain/pyramid'

const ids = Array.from({ length: 20 }, (_, i) => `c${i}`)

describe('reglamentos de la Asamblea', () => {
  it('el reglamento clásico es el de siempre (3/1/0, ida y vuelta, suben 2 y bajan 3)', () => {
    expect(DEFAULT_RULES).toMatchObject({ legs: 2, winPts: 3, drawPts: 1, awayWinPts: 3, nilNilPts: 1, promoted: 2, relegated: 3 })
    expect(rulesFor('CLASICO')).toEqual(DEFAULT_RULES)
    expect(rulesFor('no-existe')).toEqual(DEFAULT_RULES)
    expect(normalizeRules(null)).toEqual(DEFAULT_RULES)
    expect(normalizeRules({ legs: 1 })).toEqual({ ...DEFAULT_RULES, legs: 1 })
  })

  it('cada reglamento tiene nombre, bajada con humor y reglas válidas', () => {
    expect(RULESETS.length).toBeGreaterThanOrEqual(8)
    for (const r of RULESETS) {
      expect(r.id && r.name && r.blurb).toBeTruthy()
      const rules = normalizeRules(r.rules)
      expect(rules.promoted).toBeGreaterThanOrEqual(0)
      expect(rules.relegated).toBeGreaterThanOrEqual(0)
      expect(rules.promoted + rules.relegated).toBeLessThan(20)
    }
    expect(new Set(RULESETS.map(r => r.id)).size).toBe(RULESETS.length)
  })

  it('la boleta tiene 3 opciones distintas, siempre las mismas para la misma semilla', () => {
    const a = pickBallot('club:2027')
    expect(a).toHaveLength(3)
    expect(new Set(a).size).toBe(3)
    expect(pickBallot('club:2027')).toEqual(a)
    expect(pickBallot('club:2028')).not.toEqual(pickBallot('club:2029'))
  })

  it('los DT bots votan una opción de la boleta, siempre igual, con un comentario cada uno', () => {
    const ballot = pickBallot('s')
    const votes = botVotes('s', ids.slice(1), ballot)
    expect(votes).toHaveLength(19)
    expect(votes.every(v => ballot.includes(v.choice) && v.quip)).toBe(true)
    expect(botVotes('s', ids.slice(1), ballot)).toEqual(votes)
  })

  it('el escrutinio cuenta bots y usuario; el empate lo define el usuario', () => {
    const ballot = ['A', 'B', 'C']
    const bots = [{ choice: 'A' }, { choice: 'A' }, { choice: 'B' }, { choice: 'B' }]
    const t = tally(bots, 'B', ballot)
    expect(t.counts).toEqual({ A: 2, B: 3, C: 0 })
    expect(t.winner).toBe('B')
    expect(tally(bots, 'A', ballot).winner).toBe('A')
    expect(tally([{ choice: 'A' }, { choice: 'B' }], 'C', ballot).winner).toBe('C')
  })

  it('puntos: clásico 3/1/0; cero a cero prohibido; visitante dorado; goleada; valla invicta; recta final', () => {
    const base = { goalsFor: 1, goalsAgainst: 0, away: false, round: 1, rounds: 38 }
    expect(pointsFor(DEFAULT_RULES, base)).toBe(3)
    expect(pointsFor(DEFAULT_RULES, { ...base, goalsFor: 1, goalsAgainst: 1 })).toBe(1)
    expect(pointsFor(DEFAULT_RULES, { ...base, goalsFor: 0, goalsAgainst: 2 })).toBe(0)
    const nil = normalizeRules({ nilNilPts: 0 })
    expect(pointsFor(nil, { ...base, goalsFor: 0, goalsAgainst: 0 })).toBe(0)
    expect(pointsFor(nil, { ...base, goalsFor: 2, goalsAgainst: 2 })).toBe(1)
    const dorado = normalizeRules({ awayWinPts: 4 })
    expect(pointsFor(dorado, { ...base, away: true })).toBe(4)
    expect(pointsFor(dorado, { ...base, away: false })).toBe(3)
    const goleada = normalizeRules({ bigWinBonus: 1 })
    expect(pointsFor(goleada, { ...base, goalsFor: 3, goalsAgainst: 0 })).toBe(4)
    expect(pointsFor(goleada, { ...base, goalsFor: 2, goalsAgainst: 0 })).toBe(3)
    const valla = normalizeRules({ cleanSheetBonus: 1 })
    expect(pointsFor(valla, { ...base, goalsFor: 0, goalsAgainst: 0 })).toBe(2)
    expect(pointsFor(valla, { ...base, goalsFor: 2, goalsAgainst: 1 })).toBe(3)
    const recta = normalizeRules({ lastRoundsX2: 5 })
    expect(pointsFor(recta, { ...base, round: 34 })).toBe(6)
    expect(pointsFor(recta, { ...base, round: 33 })).toBe(3)
    expect(pointsFor(recta, { ...base, round: 38, goalsFor: 0, goalsAgainst: 1 })).toBe(0)
  })

  it('ida sola: 19 fechas; ida y vuelta: 38', () => {
    expect(roundRobinSchedule(ids)).toHaveLength(38)
    expect(roundRobinSchedule(ids, { legs: 2 })).toHaveLength(38)
    const one = roundRobinSchedule(ids, { legs: 1 })
    expect(one).toHaveLength(19)
    const pairs = new Set(one.flat().map(m => [m.home, m.away].sort().join('|')))
    expect(pairs.size).toBe(190)
  })

  it('ascensos y descensos salen del reglamento (por defecto 2 y 3)', () => {
    expect(movementOf(4, 4)).toBe('STAY')
    expect(movementOf(4, 4, { promoted: 4, relegated: 3 })).toBe('PROMOTED')
    expect(movementOf(2, 4, { promoted: 1, relegated: 5 })).toBe('STAY')
    expect(movementOf(16, 4, { promoted: 1, relegated: 5 })).toBe('RELEGATED')
    expect(movementOf(16, 4)).toBe('STAY')
    expect(movementOf(1, 1, { promoted: 4, relegated: 3 })).toBe('STAY')
  })
})

describe('reconocer el reglamento vigente', () => {
  it('encuentra el reglamento del catálogo a partir de sus reglas', () => {
    expect(rulesetIdFor(null)).toBe('CLASICO')
    expect(rulesetIdFor({ nilNilPts: 0 })).toBe('CERO_CERO')
    expect(rulesetIdFor(rulesFor('GUILLOTINA'))).toBe('GUILLOTINA')
    expect(rulesetIdFor({ winPts: 9 })).toBeNull()
  })
})
