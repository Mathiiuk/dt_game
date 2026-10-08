import {
  buildMatchSquad, rollAggravations, withInjuryPenalty, isAvailable,
  INJURED_FITNESS_CAP, INJURED_PERFORMANCE_FACTOR, MAX_YOUTH_CALLUPS
} from '../../src/domain/matchSquad'

const mk = (id, extra = {}) => ({
  id, first_name: 'J', last_name: id, state_fitness: 90,
  attr_overall: 60, attr_pace: 60, attr_shooting: 60, attr_finishing: 60, attr_passing: 60, attr_defending: 60,
  ...extra
})
const squadOf = (healthy, injured = 0) => [
  ...Array.from({ length: healthy }, (_, i) => mk(`h${i}`)),
  ...Array.from({ length: injured }, (_, i) => mk(`i${i}`, { is_injured: true, injury_days: 7 * (i + 1) }))
]

describe('armado del once (plantel incompleto)', () => {
  it('con plantel sano respeta la alineación del DT y no agrega nada extra', () => {
    const players = squadOf(18)
    const lineup = ['h5', 'h4', 'h3', 'h2', 'h1', 'h0', 'h6', 'h7', 'h8', 'h9', 'h10']
    const r = buildMatchSquad(players, lineup)
    expect(r.starters.map(p => p.id)).toEqual(lineup)
    expect(r.notes).toEqual([])
    expect(r.injuredPlayingIds).toEqual([])
  })

  it('reemplaza a un titular lesionado por el mejor apto disponible', () => {
    const players = [...squadOf(14), mk('star', { is_injured: true })]
    const lineup = ['star', 'h0', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9']
    const r = buildMatchSquad(players, lineup)
    expect(r.starters).toHaveLength(11)
    expect(r.starters.find(p => p.id === 'star')).toBeUndefined()
    expect(r.notes).toEqual([])
  })

  it('con 5 aptos y 15 lesionados juega igual: juveniles primero y luego lesionados penalizados', () => {
    const r = buildMatchSquad(squadOf(5, 15), [])
    expect(r.starters).toHaveLength(11)
    expect(r.healthyCount).toBe(5)
    expect(r.youthCallupCount).toBe(MAX_YOUTH_CALLUPS)
    expect(r.starters.filter(p => p.isYouthCallup)).toHaveLength(MAX_YOUTH_CALLUPS)
    // 5 aptos + 4 juveniles + 2 lesionados = 11; juegan primero los de menor gravedad
    expect(r.injuredPlayingIds).toEqual(['i0', 'i1'])
    expect(r.notes.filter(n => n.type === 'INJURED_PLAYING')).toHaveLength(2)
  })

  it('nunca devuelve menos de 11 aunque el plantel esté casi vacío', () => {
    const r = buildMatchSquad(squadOf(2, 0), [])
    expect(r.starters).toHaveLength(11)
    expect(new Set(r.starters.map(p => p.id)).size).toBe(11)
  })

  it('suspendidos y retirados nunca juegan', () => {
    const players = [mk('s', { is_suspended: true }), mk('r', { is_retired: true }), ...squadOf(11)]
    const r = buildMatchSquad(players, ['s', 'r'])
    expect(r.starters.some(p => p.id === 's' || p.id === 'r')).toBe(false)
    expect(isAvailable(players[0])).toBe(false)
  })
})

describe('jugar lesionado', () => {
  it('aplica -20% al rendimiento, tope de fitness 50 y no muta al original', () => {
    const p = mk('x', { is_injured: true, state_fitness: 80, attr_pace: 70 })
    const q = withInjuryPenalty(p)
    expect(q.attr_pace).toBe(Math.round(70 * INJURED_PERFORMANCE_FACTOR))
    expect(q.state_fitness).toBe(INJURED_FITNESS_CAP)
    expect(q.playingInjured).toBe(true)
    expect(p.attr_pace).toBe(70)
  })

  it('el riesgo de agravar es del 35%: determinista con rng inyectado', () => {
    expect(rollAggravations(['a', 'b', 'c'], () => 0.1)).toEqual(['a', 'b', 'c'])
    expect(rollAggravations(['a', 'b'], () => 0.9)).toEqual([])
    const seq = [0.2, 0.5, 0.3]
    let i = 0
    expect(rollAggravations(['a', 'b', 'c'], () => seq[i++])).toEqual(['a', 'c'])
  })
})

import { assignToSlots, buildRivalLineup } from '../../src/domain/matchSquad'
import { ratingAtSlot } from '../../src/domain/ratings'

describe('puestos del once (B7)', () => {
  const mk = (id, position, overall, extra = {}) => ({ id, first_name: id, last_name: id, position, attr_overall: overall, state_fitness: 90, ...extra })
  const slots = ['PO', 'DFC1', 'DC1']
  const gk = mk('gk', 'PO', 64)
  const cb = mk('cb', 'DFC', 62)
  const st = mk('st', 'DC', 66)

  it('cada titular conserva el puesto que le dio el DT y sale con su media en ese puesto', () => {
    const { starters } = buildMatchSquad([gk, cb, st], ['gk', 'cb', 'st'], 3, slots)
    expect(starters.map(s => s.slot)).toEqual(['PO', 'DFC1', 'DC1'])
    expect(starters.map(s => s.slot_base)).toEqual(['PO', 'DFC', 'DC'])
    expect(starters.map(s => s.slot_rating)).toEqual([64, 62, 66])
  })

  it('un arquero puesto de delantero rinde una fracción de su media (el nivel del once cae)', () => {
    const { starters } = buildMatchSquad([gk, cb, st], ['st', 'cb', 'gk'], 3, slots) // el DT cruzó arquero y delantero
    const byPos = Object.fromEntries(starters.map(s => [s.slot, s.slot_rating]))
    expect(byPos.PO).toBeLessThan(30)
    expect(byPos.DC1).toBeLessThan(30)
    const good = buildMatchSquad([gk, cb, st], ['gk', 'cb', 'st'], 3, slots).starters.reduce((s, p) => s + p.slot_rating, 0)
    const bad = starters.reduce((s, p) => s + p.slot_rating, 0)
    expect(good).toBeGreaterThan(bad + 50)
  })

  it('si un titular está lesionado entra el mejor reemplazo disponible en ese puesto', () => {
    const hurt = { ...st, is_injured: true }
    const sub = mk('sub', 'DC', 58)
    const { starters } = buildMatchSquad([gk, cb, hurt, sub], ['gk', 'cb', 'st'], 3, slots)
    expect(starters.find(s => s.slot === 'DC1').id).toBe('sub')
  })

  it('el juvenil de reserva juega en el puesto que falta sin castigo por posición', () => {
    const { starters } = buildMatchSquad([gk, cb], ['gk', 'cb'], 3, slots)
    const y = starters.find(s => s.isYouthCallup)
    expect(y.slot_base).toBe(y.position)
    expect(y.slot_rating).toBe(45)
  })

  it('sin puestos (compatibilidad) los titulares salen sin media por puesto', () => {
    const { starters } = buildMatchSquad([gk, cb, st], ['gk', 'cb', 'st'], 3)
    expect(starters[0].slot_rating).toBeUndefined()
  })

  it('assignToSlots ubica a los de reemplazo donde mejor rinden', () => {
    const out = assignToSlots([st, gk, cb], ['PO', 'DFC1', 'DC1'], [])
    expect(out.find(s => s.id === 'gk').slot).toBe('PO')
    expect(out.find(s => s.id === 'st').slot).toBe('DC1')
    expect(ratingAtSlot(st, 'DC1')).toBe(66)
  })

  it('el once rival genérico rinde 50 + reputación/2 en todos sus puestos', () => {
    const rival = buildRivalLineup(15)
    expect(rival).toHaveLength(11)
    expect(new Set(rival.map(p => p.slot_rating))).toEqual(new Set([58]))
    expect(rival[0].slot_base).toBe('PO')
  })
})

describe('nombres del once rival', () => {
  it('tiene nombres propios y siempre los mismos para el mismo club', () => {
    const a = buildRivalLineup(15, 60, 'club-1')
    expect(a.map(p => `${p.first_name} ${p.last_name}`)).toEqual(buildRivalLineup(15, 60, 'club-1').map(p => `${p.first_name} ${p.last_name}`))
    expect(a.every(p => !/Rival #/.test(p.last_name))).toBe(true)
    expect(new Set(a.map(p => `${p.first_name} ${p.last_name}`)).size).toBeGreaterThan(8)
    expect(a.map(p => p.last_name)).not.toEqual(buildRivalLineup(15, 60, 'club-2').map(p => p.last_name))
  })
})
