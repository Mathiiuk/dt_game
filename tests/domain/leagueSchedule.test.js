import { roundRobinSchedule } from '../../src/domain/leagueSchedule'

const ids = (n) => Array.from({ length: n }, (_, i) => `c${i}`)

describe('calendario de liga', () => {
  it('20 clubes: 38 fechas de 10 partidos (ida y vuelta)', () => {
    const rounds = roundRobinSchedule(ids(20))
    expect(rounds).toHaveLength(38)
    expect(rounds.every(r => r.length === 10)).toBe(true)
  })

  it('cada club juega una vez por fecha y se cruza exactamente dos veces con cada rival', () => {
    const clubs = ids(20)
    const rounds = roundRobinSchedule(clubs)
    const pairsCount = new Map()
    for (const round of rounds) {
      const seen = new Set()
      for (const m of round) {
        expect(seen.has(m.home) || seen.has(m.away)).toBe(false)
        seen.add(m.home); seen.add(m.away)
        const key = [m.home, m.away].sort().join('|')
        pairsCount.set(key, (pairsCount.get(key) || 0) + 1)
      }
      expect(seen.size).toBe(20)
    }
    expect(pairsCount.size).toBe(190)
    for (const count of pairsCount.values()) {
      expect(count).toBe(2)
    }
  })

  it('la localía queda perfectamente equilibrada: cada club juega 19 de local y 19 de visitante', () => {
    const rounds = roundRobinSchedule(ids(20))
    const home = {}
    for (const round of rounds) for (const m of round) home[m.home] = (home[m.home] || 0) + 1
    for (const c of ids(20)) expect(home[c] || 0).toBe(19)
  })

  it('cantidad impar de clubes: alguien descansa por fecha', () => {
    const rounds = roundRobinSchedule(ids(5))
    expect(rounds).toHaveLength(10) // 5 idas + 5 vueltas
    expect(rounds.every(r => r.length === 2)).toBe(true)
  })

  it('menos de dos clubes no arma calendario', () => {
    expect(roundRobinSchedule(['a'])).toEqual([])
    expect(roundRobinSchedule([])).toEqual([])
  })
})
