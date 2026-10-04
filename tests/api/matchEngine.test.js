// El motor importa el cliente de Supabase; en tests se reemplaza por un stub (no se hace ninguna llamada real)
vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { createRNG, simulateMatch } from '../../src/api/matchEngine'

const squad = (level) => Array.from({ length: 11 }, (_, i) => ({
  id: `p${i}`, first_name: 'J', last_name: `${i}`, state_fitness: 90,
  attr_pace: level, attr_shooting: level, attr_passing: level, attr_defending: level
}))
const tactic = { formation: '4-4-2', mentality: 'BALANCED' }

describe('motor de partidos', () => {
  it('el RNG es determinista por semilla', () => {
    const a = createRNG('semilla'); const b = createRNG('semilla'); const c = createRNG('otra')
    const sa = [a(), a(), a()]
    expect(sa).toEqual([b(), b(), b()])
    expect(sa).not.toEqual([c(), c(), c()])
    sa.forEach(n => { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(1) })
  })

  it('la misma semilla produce exactamente el mismo partido (reproducible y auditable)', () => {
    const r1 = simulateMatch(tactic, squad(60), tactic, squad(55), 'fixture-1')
    const r2 = simulateMatch(tactic, squad(60), tactic, squad(55), 'fixture-1')
    expect(r1).toEqual(r2)
  })

  it('devuelve marcador entero, pitazo final y posesión que suma 100', () => {
    const r = simulateMatch(tactic, squad(60), tactic, squad(60), 'x')
    expect(Number.isInteger(r.homeScore)).toBe(true)
    expect(Number.isInteger(r.awayScore)).toBe(true)
    expect(r.events.some(e => e.type === 'END' && e.minute === 90)).toBe(true)
    expect(r.stats.possession.home + r.stats.possession.away).toBe(100)
  })

  it('el equipo claramente superior gana más partidos que el inferior', () => {
    let strongWins = 0; let weakWins = 0
    for (let i = 0; i < 150; i++) {
      const r = simulateMatch(tactic, squad(80), tactic, squad(40), `seed-${i}`)
      if (r.homeScore > r.awayScore) strongWins++
      if (r.awayScore > r.homeScore) weakWins++
    }
    expect(strongWins).toBeGreaterThan(weakWins * 2)
  })
})
