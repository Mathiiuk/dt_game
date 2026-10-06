import { roundRobinSchedule } from '../../src/domain/leagueSchedule'

const ids = (n) => Array.from({ length: n }, (_, i) => `c${i}`)

describe('calendario de liga', () => {
  it('20 clubes: 19 fechas de 10 partidos', () => {
    const rounds = roundRobinSchedule(ids(20))
    expect(rounds).toHaveLength(19)
    expect(rounds.every(r => r.length === 10)).toBe(true)
  })

  it('cada club juega una vez por fecha y se cruza una sola vez con cada rival', () => {
    const clubs = ids(20)
    const rounds = roundRobinSchedule(clubs)
    const pairs = new Set()
    for (const round of rounds) {
      const seen = new Set()
      for (const m of round) {
        expect(seen.has(m.home) || seen.has(m.away)).toBe(false)
        seen.add(m.home); seen.add(m.away)
        const key = [m.home, m.away].sort().join('|')
        expect(pairs.has(key)).toBe(false)
        pairs.add(key)
      }
      expect(seen.size).toBe(20)
    }
    expect(pairs.size).toBe(190)
  })

  it('la localía queda repartida: ningún club juega más de 10 de local ni menos de 9', () => {
    const rounds = roundRobinSchedule(ids(20))
    const home = {}
    for (const round of rounds) for (const m of round) home[m.home] = (home[m.home] || 0) + 1
    for (const c of ids(20)) expect([9, 10]).toContain(home[c] || 0)
  })

  it('nadie juega más de 3 fechas seguidas de visitante', () => {
    const rounds = roundRobinSchedule(ids(20))
    for (const c of ids(20)) {
      let streak = 0
      for (const round of rounds) {
        const m = round.find(x => x.home === c || x.away === c)
        streak = m.away === c ? streak + 1 : 0
        expect(streak).toBeLessThanOrEqual(3)
      }
    }
  })

  it('cantidad impar de clubes: alguien descansa por fecha', () => {
    const rounds = roundRobinSchedule(ids(5))
    expect(rounds).toHaveLength(5)
    expect(rounds.every(r => r.length === 2)).toBe(true)
  })

  it('menos de dos clubes no arma calendario', () => {
    expect(roundRobinSchedule(['a'])).toEqual([])
    expect(roundRobinSchedule([])).toEqual([])
  })
})
