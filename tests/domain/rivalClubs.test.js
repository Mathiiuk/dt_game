import { pickRivalClubs, RIVAL_POOL } from '../../src/domain/rivalClubs'

describe('rivales de cada liga', () => {
  it('hay un pozo grande sin nombres ni siglas repetidas', () => {
    expect(RIVAL_POOL.length).toBeGreaterThanOrEqual(50)
    expect(new Set(RIVAL_POOL.map(c => c.name)).size).toBe(RIVAL_POOL.length)
    expect(new Set(RIVAL_POOL.map(c => c.short_name)).size).toBe(RIVAL_POOL.length)
  })

  it('la misma carrera siempre tiene los mismos 19 rivales, sin repetidos', () => {
    const a = pickRivalClubs('club-1')
    expect(a).toHaveLength(19)
    expect(new Set(a.map(c => c.name)).size).toBe(19)
    expect(pickRivalClubs('club-1')).toEqual(a)
  })

  it('carreras distintas tienen rivales distintos', () => {
    const names = (seed) => pickRivalClubs(seed).map(c => c.name).join('|')
    const sets = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(names))
    expect(sets.size).toBeGreaterThan(4)
  })

  it('se puede excluir un nombre (el del club del jugador)', () => {
    const picked = pickRivalClubs('club-1', 19, ['deportivo central', 'Atlético Belgrano'])
    expect(picked.some(c => c.name === 'Deportivo Central' || c.name === 'Atlético Belgrano')).toBe(false)
    expect(picked).toHaveLength(19)
  })

  it('respeta la cantidad pedida', () => {
    expect(pickRivalClubs('x', 5)).toHaveLength(5)
  })
})
