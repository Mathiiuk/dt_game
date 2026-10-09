import { describe, it, expect } from 'vitest'
import { shotPath, flightPlan, cornerLanding, sweepPhase, ZONE_X } from '../../src/domain/shotPath'

// Generador con semilla (mulberry32): semillas cercanas dan secuencias bien distintas
const seeded = (seed = 1) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

describe('trayectoria del penal y del tiro libre', () => {
  it('la pelota va cerca de la zona apuntada', () => {
    for (const aim of ['L', 'C', 'R']) {
      for (let s = 1; s <= 40; s++) {
        const p = shotPath({ aim, quality: 0.9 }, seeded(s))
        expect(Math.abs(p.x - ZONE_X[aim])).toBeLessThanOrEqual(8.5)
        expect(p.off).toBeNull()
      }
    }
  })

  it('no va siempre al mismo lugar: con distinto azar cambia dónde llega', () => {
    const spots = new Set(Array.from({ length: 30 }, (_, i) => { const p = shotPath({ aim: 'R', quality: 0.6 }, seeded(i + 1)); return `${p.x}|${p.y}` }))
    expect(spots.size).toBeGreaterThan(20)
  })

  it('un buen golpe es más preciso que uno flojo', () => {
    const spread = (quality) => { const xs = Array.from({ length: 60 }, (_, i) => shotPath({ aim: 'C', quality }, seeded(i + 1)).x); return Math.max(...xs) - Math.min(...xs) }
    expect(spread(0.95)).toBeLessThan(spread(0.3))
  })

  it('un buen golpe va al piso o al ángulo, no al medio del arco', () => {
    const ys = Array.from({ length: 60 }, (_, i) => shotPath({ aim: 'L', quality: 0.95 }, seeded(i + 1)).y)
    expect(ys.every(y => y <= 24 || y >= 72)).toBe(true)
  })

  it('un golpe muy malo se va afuera, como cuenta el relato, y uno decente nunca', () => {
    const bad = Array.from({ length: 30 }, (_, i) => shotPath({ aim: 'C', quality: 0.05 }, seeded(i + 1)))
    expect(bad.every(p => p.off)).toBe(true)
    expect(new Set(bad.map(p => p.off)).size).toBeGreaterThan(1)
    for (const p of bad) {
      if (p.off === 'OVER') expect(p.y).toBeGreaterThan(100)
      else expect(p.x < 0 || p.x > 100).toBe(true)
    }
    expect(Array.from({ length: 30 }, (_, i) => shotPath({ aim: 'C', quality: 0.2 }, seeded(i + 1))).every(p => !p.off)).toBe(true)
  })

  it('tarda entre 380 y 560 ms y tolera datos raros', () => {
    for (let s = 1; s < 20; s++) {
      const { ms } = shotPath({ aim: 'L', quality: 0.5 }, seeded(s))
      expect(ms).toBeGreaterThanOrEqual(380)
      expect(ms).toBeLessThanOrEqual(560)
    }
    expect(shotPath({}, seeded(2)).x).toBeGreaterThan(0)
    expect(shotPath({ aim: 'X', quality: 'mal' }, seeded(2)).off).not.toBeUndefined()
  })
})

describe('remate en contra, córner y barra de potencia', () => {
  it('el remate sale desde distintos lugares, con tiempos y alturas distintos', () => {
    const plans = Array.from({ length: 30 }, (_, i) => flightPlan(seeded(i + 1)))
    expect(new Set(plans.map(p => p.startX)).size).toBeGreaterThan(8)
    expect(plans.every(p => p.flightMs >= 700 && p.flightMs <= 1000 && p.endTop >= 26 && p.endTop <= 44 && Math.abs(p.jitterX) <= 7)).toBe(true)
  })

  it('el córner cae dentro de la zona elegida y cambia cada vez', () => {
    for (let s = 1; s < 30; s++) {
      expect(cornerLanding('NEAR', seeded(s)).x).toBeLessThan(34)
      expect(cornerLanding('MID', seeded(s)).x).toBeGreaterThan(36)
      expect(cornerLanding('MID', seeded(s)).x).toBeLessThan(64)
      expect(cornerLanding('FAR', seeded(s)).x).toBeGreaterThan(66)
    }
    expect(new Set(Array.from({ length: 20 }, (_, i) => cornerLanding('MID', seeded(i + 1)).y)).size).toBeGreaterThan(8)
    expect(cornerLanding('XX', seeded(3)).x).toBeGreaterThan(36)
  })

  it('la barra arranca en otro punto y a otra velocidad cada vez', () => {
    const phases = Array.from({ length: 30 }, (_, i) => sweepPhase(seeded(i + 1)))
    expect(phases.every(p => p.duration >= 0.65 && p.duration <= 0.95 && p.delay <= 0 && p.delay >= -1.6)).toBe(true)
    expect(new Set(phases.map(p => p.delay)).size).toBeGreaterThan(10)
  })
})
