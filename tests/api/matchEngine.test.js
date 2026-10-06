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

describe('cambios en vivo', () => {
  const strong = squad(80)
  const weak = squad(40)

  it('hasta el minuto del cambio el partido es idéntico y después rinde el nuevo once', () => {
    const base = simulateMatch(tactic, weak, tactic, strong, 'cambio-1')
    const changed = simulateMatch(tactic, weak, tactic, strong, 'cambio-1', { changes: [{ minute: 45, team: 'home', players: squad(95).map((p, i) => ({ ...p, id: `n${i}` })) }] })
    const upTo = (r) => r.events.filter(e => e.minute <= 45)
    expect(upTo(changed)).toEqual(upTo(base))
  })

  it('un once mucho mejor desde el entretiempo mete más goles en promedio', () => {
    let baseGoals = 0, changedGoals = 0
    const better = squad(99).map((p, i) => ({ ...p, id: `n${i}` }))
    for (let i = 0; i < 150; i++) {
      baseGoals += simulateMatch(tactic, weak, tactic, strong, `c-${i}`).homeScore
      changedGoals += simulateMatch(tactic, weak, tactic, strong, `c-${i}`, { changes: [{ minute: 45, team: 'home', players: better }] }).homeScore
    }
    expect(changedGoals).toBeGreaterThan(baseGoals)
  })

  it('sin cambios el resultado es el de siempre', () => {
    expect(simulateMatch(tactic, weak, tactic, strong, 's', { changes: [] })).toEqual(simulateMatch(tactic, weak, tactic, strong, 's'))
  })
})

describe('gritos y decisiones del DT cambian el partido', () => {
  const even = () => squad(60)
  const goals = (changes, side) => {
    let total = 0
    for (let i = 0; i < 200; i++) {
      const r = simulateMatch(tactic, even(), tactic, even(), `g-${i}`, { changes })
      total += side === 'home' ? r.homeScore : r.awayScore
    }
    return total
  }

  it('atacar con todo desde el inicio mete más goles y recibe más', () => {
    const attack = [{ minute: 0, team: 'home', buff: { att: 1.4, def: 0.7 }, duration: 90 }]
    expect(goals(attack, 'home')).toBeGreaterThan(goals([], 'home'))
    expect(goals(attack, 'away')).toBeGreaterThan(goals([], 'away'))
  })

  it('cerrar atrás desde el inicio recibe menos goles', () => {
    const lock = [{ minute: 0, team: 'home', buff: { def: 1.5, att: 0.9 }, duration: 90 }]
    expect(goals(lock, 'away')).toBeLessThan(goals([], 'away'))
  })

  it('el efecto dura solo los minutos indicados: hasta el cambio el partido es idéntico', () => {
    const base = simulateMatch(tactic, even(), tactic, even(), 'dur-1')
    const withBuff = simulateMatch(tactic, even(), tactic, even(), 'dur-1', { changes: [{ minute: 60, team: 'home', buff: { att: 2 }, duration: 15 }] })
    expect(withBuff.events.filter(e => e.minute <= 60)).toEqual(base.events.filter(e => e.minute <= 60))
  })

  it('el visitante también se beneficia de su propio ataque (no se usa el del local)', () => {
    const buff = [{ minute: 0, team: 'away', buff: { att: 1.5 }, duration: 90 }]
    expect(goals(buff, 'away')).toBeGreaterThan(goals([], 'away'))
  })

  it('un grito de posesión sube la posesión', () => {
    const base = simulateMatch(tactic, even(), tactic, even(), 'pos')
    const calm = simulateMatch(tactic, even(), tactic, even(), 'pos', { changes: [{ minute: 0, team: 'home', buff: { mid: 1.5 }, duration: 90 }] })
    expect(calm.stats.possession.home).toBeGreaterThan(base.stats.possession.home)
  })

  it('una roja le cuesta goles al equipo que se queda con diez', () => {
    let reds = 0
    let dropped = 0
    let gained = 0
    for (let i = 0; i < 4000; i++) {
      const r = simulateMatch(tactic, even(), tactic, even(), `roja-${i}`)
      const red = r.events.find(e => e.type === 'CARD_RED')
      if (!red) continue
      reds++
      const after = r.events.filter(e => e.type === 'GOAL' && e.minute > red.minute)
      const mine = after.filter(e => e.team === red.team).length
      const theirs = after.length - mine
      if (mine < theirs) dropped++
      if (mine > theirs) gained++
    }
    expect(reds).toBeGreaterThan(20)
    expect(dropped).toBeGreaterThan(gained)
  })
})
