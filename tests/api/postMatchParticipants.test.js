vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('../../src/api/manager', () => ({ managerApi: {} }))
vi.mock('../../src/api/gameConfig', () => ({ gameConfigApi: {} }))
vi.mock('../../src/api/audit', () => ({ auditApi: {} }))
vi.mock('../../src/api/clubHistory', () => ({ clubHistoryApi: {} }))
vi.mock('../../src/api/achievements', () => ({ achievementsApi: {} }))

import { selectParticipants, scorersFromRatings } from '../../src/api/postMatch'

const squad = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

describe('quiénes juegan y quiénes hacen goles en el post-partido', () => {
  it('sólo los titulares participan; sin dato se toma el plantel completo (compatibilidad)', () => {
    expect(selectParticipants(squad, ['a', 'c']).map(p => p.id)).toEqual(['a', 'c'])
    expect(selectParticipants(squad, []).map(p => p.id)).toEqual(['a', 'b', 'c'])
    expect(selectParticipants(squad, undefined)).toHaveLength(3)
  })

  it('los goleadores se repiten una vez por gol (así los suma el historial de jugadores)', () => {
    expect(scorersFromRatings([{ player_id: 'a', goals: 2 }, { player_id: 'b', goals: 0 }, { player_id: 'c', goals: 1 }])).toEqual(['a', 'a', 'c'])
    expect(scorersFromRatings([])).toEqual([])
  })

  it('un titular ignorado en la base (juvenil de reemplazo) no rompe la selección', () => {
    expect(selectParticipants(squad, ['a', 'youth-callup-0']).map(p => p.id)).toEqual(['a'])
  })
})

import { isGoalBy } from '../../src/api/postMatch'

describe('quién hizo el gol', () => {
  const ana = { id: 'a', first_name: 'Ana', last_name: 'Gómez' }
  const bea = { id: 'b', first_name: 'Bea', last_name: 'Ruiz' }
  const goal = { type: 'GOAL', playerId: 'a', text: '¡GOL! Golazo de Ana Gómez tras asistencia de Bea Ruiz.' }

  it('con playerId cuenta sólo para el goleador, no para quien dio la asistencia', () => {
    expect(isGoalBy(goal, ana)).toBe(true)
    expect(isGoalBy(goal, bea)).toBe(false)
  })

  it('sin playerId usa el texto "Golazo de ..." y distingue al asistidor', () => {
    const old = { type: 'GOAL', text: '¡GOL! Golazo de Ana Gómez tras asistencia de Bea Ruiz.' }
    expect(isGoalBy(old, ana)).toBe(true)
    expect(isGoalBy(old, bea)).toBe(false)
  })

  it('otros eventos no son goles', () => {
    expect(isGoalBy({ type: 'SAVE', playerId: 'a' }, ana)).toBe(false)
  })
})
