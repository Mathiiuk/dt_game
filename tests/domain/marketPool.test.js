import { freeAgentSpecs, freeAgentsNeeded, FREE_AGENT_POOL_MIN, FREE_AGENT_POOL_TARGET } from '../../src/domain/marketPool'
import { POSITION_CODES } from '../../src/domain/positions'

const seeded = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }

describe('agentes libres del mercado', () => {
  it('repone cuando quedan pocos y no cuando el pozo alcanza', () => {
    expect(freeAgentsNeeded(0)).toBe(FREE_AGENT_POOL_TARGET)
    expect(freeAgentsNeeded(FREE_AGENT_POOL_MIN - 1)).toBe(FREE_AGENT_POOL_TARGET - FREE_AGENT_POOL_MIN + 1)
    expect(freeAgentsNeeded(FREE_AGENT_POOL_MIN)).toBe(0)
    expect(freeAgentsNeeded(40)).toBe(0)
  })

  it('los perfiles tienen medias, edades y potencial razonables y reparten las posiciones', () => {
    const specs = freeAgentSpecs(60, seeded(7))
    expect(specs).toHaveLength(60)
    for (const s of specs) {
      expect(s.overall).toBeGreaterThanOrEqual(44)
      expect(s.overall).toBeLessThanOrEqual(68)
      expect(s.age).toBeGreaterThanOrEqual(18)
      expect(s.age).toBeLessThanOrEqual(35)
      expect(s.potential).toBeGreaterThanOrEqual(s.overall)
      expect(POSITION_CODES).toContain(s.position)
    }
    expect(new Set(specs.map(s => s.position)).size).toBe(POSITION_CODES.length)
    const avg = specs.reduce((a, s) => a + s.overall, 0) / specs.length
    expect(avg).toBeGreaterThan(52)
    expect(avg).toBeLessThan(60)
  })

  it('los jóvenes tienen potencial por explotar y los veteranos no', () => {
    const specs = freeAgentSpecs(300, seeded(3))
    const young = specs.filter(s => s.age <= 22)
    const old = specs.filter(s => s.age > 26)
    expect(young.every(s => s.potential > s.overall)).toBe(true)
    expect(old.every(s => s.potential === s.overall)).toBe(true)
  })
})
