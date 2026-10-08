import { describe, it, expect } from 'vitest'
import { FIRST_NAMES, LAST_NAMES, rivalNames } from '../../src/domain/rivalNames'
import { buildRivalLineup } from '../../src/domain/matchSquad'

describe('nombres de los rivales', () => {
  it('hay más de diez mil combinaciones y las listas no tienen repetidos', () => {
    expect(new Set(FIRST_NAMES).size).toBe(FIRST_NAMES.length)
    expect(new Set(LAST_NAMES).size).toBe(LAST_NAMES.length)
    expect(FIRST_NAMES.length * LAST_NAMES.length).toBeGreaterThan(10000)
  })

  it('dentro de un once no se repite ningún nombre ni apellido', () => {
    for (let i = 0; i < 300; i++) {
      const names = rivalNames(`club-${i}`, 11)
      expect(names).toHaveLength(11)
      expect(new Set(names.map(n => n.first_name)).size).toBe(11)
      expect(new Set(names.map(n => n.last_name)).size).toBe(11)
      expect(names.every(n => n.first_name !== n.last_name)).toBe(true)
    }
  })

  it('cada club tiene el suyo: siempre el mismo y casi nunca iguales entre clubes', () => {
    expect(rivalNames('club-7')).toEqual(rivalNames('club-7'))
    const full = (seed) => rivalNames(seed).map(n => `${n.first_name} ${n.last_name}`)
    const seen = new Map()
    let repeated = 0
    for (let i = 0; i < 200; i++) for (const n of full(`liga-${i}`)) { if (seen.has(n)) repeated++; seen.set(n, true) }
    // 2200 jugadores entre 200 clubes: unos pocos repetidos por azar, no decenas
    expect(repeated).toBeLessThan(2200 * 0.2)
    expect(full('liga-1')).not.toEqual(full('liga-2'))
  })

  it('el once rival armado usa esos nombres', () => {
    const lineup = buildRivalLineup(15, 60, 'club-9')
    expect(lineup.map(p => ({ first_name: p.first_name, last_name: p.last_name }))).toEqual(rivalNames('club-9', 11))
  })
})
