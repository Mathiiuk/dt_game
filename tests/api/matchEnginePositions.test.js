vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { slotBasedPower, simulateMatch } from '../../src/api/matchEngine'
import { buildRivalLineup } from '../../src/domain/matchSquad'

const side = (map) => Object.entries(map).map(([slot, rating]) => ({ id: slot, first_name: slot, last_name: '', slot, slot_base: slot.replace(/\d+$/, ''), slot_rating: rating, position: slot.replace(/\d+$/, ''), state_fitness: 90 }))
const good = { PO: 64, DFC1: 62, DFC2: 62, LI: 60, LD: 60, MI: 60, MC1: 62, MC2: 62, MD: 60, DC1: 66, DC2: 64 }

describe('poder del equipo según el puesto de cada jugador', () => {
  it('un equipo parejo tiene ataque, defensa y mediocampo cerca de la media de sus jugadores', () => {
    const p = slotBasedPower(side(Object.fromEntries(Object.keys(good).map(k => [k, 60]))))
    expect(p.attack).toBeCloseTo(60, 5)
    expect(p.defense).toBeCloseTo(60, 5)
    expect(p.midfield).toBeCloseTo(60, 5)
  })

  it('el arquero de delantero y el delantero de arquero hunden ataque y defensa', () => {
    const ok = slotBasedPower(side(good))
    const swapped = slotBasedPower(side({ ...good, PO: 10, DC1: 12 }))
    expect(swapped.attack).toBeLessThan(ok.attack - 5)
    expect(swapped.defense).toBeLessThan(ok.defense - 5)
  })

  it('en el partido, el equipo con el arquero de delantero pierde mucho más seguido que el bien armado', () => {
    const rival = buildRivalLineup(15)
    let wellWins = 0
    let swappedWins = 0
    for (let i = 0; i < 60; i++) {
      const a = simulateMatch({}, side(good), {}, rival, `seed-${i}`)
      const b = simulateMatch({}, side({ ...good, PO: 10, DC1: 12 }), {}, rival, `seed-${i}`)
      if (a.homeScore > a.awayScore) wellWins++
      if (b.homeScore > b.awayScore) swappedWins++
    }
    expect(wellWins).toBeGreaterThan(swappedWins)
  })

  it('los goleadores y asistidores salen de la línea en que juega cada uno, no de su posición natural', () => {
    // todos "delanteros" por posición natural pero jugando de defensores y arquero: no deberían definir los goles
    const players = side(good).map(p => ({ ...p, position: 'DC' }))
    const res = simulateMatch({}, players, {}, buildRivalLineup(15), 'goal-seed')
    const goals = res.events.filter(e => e.type === 'GOAL' && e.team === 'home')
    for (const g of goals) {
      const scorer = players.find(p => p.id === g.playerId)
      expect(['DC1', 'DC2']).toContain(scorer.slot)
    }
  })
})
