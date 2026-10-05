const tables = {}

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.in = () => q
    q.then = (resolve) => resolve({ data: tables[table] ?? [], error: null })
    return q
  }
  return { supabase: { from: chain } }
})

import { chemistryApi } from '../../src/api/chemistry'
import { simulateMatch } from '../../src/api/matchEngine'
import { queryCache } from '../../src/utils/cache'

describe('contexto de química', () => {
  beforeEach(() => {
    queryCache.clear()
    tables.player_mentorships = [{ veteran_player_id: 'vet', youth_player_id: 'pibe' }]
    tables.player_personalities = [{ player_id: 'a', primary_archetype: 'NATURAL_LEADER' }]
  })

  it('arma los pares de mentoría sin importar el orden y los arquetipos por jugador', async () => {
    const ctx = await chemistryApi.getContext('c1', [{ id: 'a' }, { id: 'b' }])
    expect(ctx.mentorPairs.has('pibe|vet')).toBe(true)
    expect(ctx.archetypes.get('a')).toBe('NATURAL_LEADER')
  })

  it('sin club devuelve un contexto vacío', async () => {
    const ctx = await chemistryApi.getContext(null)
    expect(ctx.mentorPairs.size).toBe(0)
  })

  it('agrega el arquetipo a cada jugador y cae a su campo personality', async () => {
    const ctx = await chemistryApi.getContext('c2', [{ id: 'a' }])
    const players = chemistryApi.withArchetypes([{ id: 'a' }, { id: 'b', personality: 'FRAGILE' }, { id: 'c' }], ctx)
    expect(players.map(p => p.archetype)).toEqual(['NATURAL_LEADER', 'FRAGILE', null])
  })
})

describe('la química cambia el rendimiento en el partido', () => {
  const squad = Array.from({ length: 11 }, (_, i) => ({
    id: `p${i}`, first_name: 'J', last_name: `${i}`, state_fitness: 85, attr_pace: 60, attr_shooting: 60, attr_passing: 60, attr_defending: 60
  }))

  const goalDiff = (homeFactor, awayFactor) => {
    let diff = 0
    for (let i = 0; i < 120; i++) {
      const r = simulateMatch({}, squad, {}, squad, `seed-${i}`, { homePowerFactor: homeFactor, awayPowerFactor: awayFactor })
      diff += r.homeScore - r.awayScore
    }
    return diff
  }

  it('el equipo con mejor química convierte más que el de peor química', () => {
    expect(goalDiff(1.03, 0.97)).toBeGreaterThan(goalDiff(0.97, 1.03))
  })
})
