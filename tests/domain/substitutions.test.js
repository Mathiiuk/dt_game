import { benchOf, makeSubstitution, substitutionsLeft, MAX_SUBSTITUTIONS } from '../../src/domain/substitutions'

const mk = (id, extra = {}) => ({
  id, first_name: 'J', last_name: id, position: 'MC', state_fitness: 90, attr_overall: 60,
  attr_pace: 60, attr_shooting: 60, attr_finishing: 60, attr_passing: 60, attr_defending: 60, ...extra
})
const onField = [mk('a', { slot: 'MC', slot_base: 'MC', slot_rating: 60 }), mk('b', { slot: 'DC', slot_base: 'DC', slot_rating: 60 })]
const players = [...onField, mk('x', { attr_overall: 70 }), mk('y', { attr_overall: 65 }), mk('hurt', { is_injured: true }), mk('s', { is_suspended: true })]

describe('cambios de jugadores', () => {
  it('el banco son los aptos que no están en la cancha, los mejores primero', () => {
    expect(benchOf(players, onField).map(p => p.id)).toEqual(['x', 'y'])
  })

  it('el que entra ocupa el puesto del que sale con su media en ese puesto', () => {
    const r = makeSubstitution({ onField, players, subsMade: [], outId: 'a', inId: 'x', minute: 60 })
    expect(r.ok).toBe(true)
    const entered = r.onField.find(p => p.id === 'x')
    expect(entered.slot).toBe('MC')
    expect(entered.slot_rating).toBe(70)
    expect(r.onField.some(p => p.id === 'a')).toBe(false)
    expect(r.sub).toMatchObject({ outId: 'a', inId: 'x', minute: 60 })
  })

  it('fuera de posición rinde menos que en la suya', () => {
    const r = makeSubstitution({ onField, players, subsMade: [], outId: 'b', inId: 'x', minute: 60 })
    expect(r.onField.find(p => p.id === 'x').slot_rating).toBeLessThan(70)
  })

  it('el que salió no vuelve a entrar y el que entró no puede salir ni entrar otra vez', () => {
    const first = makeSubstitution({ onField, players, subsMade: [], outId: 'a', inId: 'x', minute: 50 })
    const subs = [first.sub]
    expect(benchOf(players, first.onField, subs).map(p => p.id)).toEqual(['y'])
    expect(makeSubstitution({ onField: first.onField, players, subsMade: subs, outId: 'b', inId: 'a', minute: 60 }).ok).toBe(false)
  })

  it('tope de cinco cambios', () => {
    const subsMade = Array.from({ length: MAX_SUBSTITUTIONS }, (_, i) => ({ outId: `o${i}`, inId: `i${i}`, minute: 10 }))
    expect(substitutionsLeft(subsMade)).toBe(0)
    const r = makeSubstitution({ onField, players, subsMade, outId: 'a', inId: 'x', minute: 80 })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/5 cambios/)
  })

  it('valida que el que sale esté en la cancha y el que entra sea apto', () => {
    expect(makeSubstitution({ onField, players, subsMade: [], outId: 'zzz', inId: 'x', minute: 5 }).ok).toBe(false)
    expect(makeSubstitution({ onField, players, subsMade: [], outId: 'a', inId: 'hurt', minute: 5 }).ok).toBe(false)
  })
})
