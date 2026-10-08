import { describe, it, expect } from 'vitest'
import { RIVAL_STYLES, rivalStyleFor, stylesToMods, NEUTRAL_STYLE } from '../../src/domain/rivalStyle'

describe('personalidad de juego del rival', () => {
  it('cada club tiene siempre el mismo estilo y se reparten entre todos', () => {
    expect(rivalStyleFor('club-1').id).toBe(rivalStyleFor('club-1').id)
    const seen = new Set(Array.from({ length: 80 }, (_, i) => rivalStyleFor(`club-${i}`).id))
    expect(seen.size).toBe(RIVAL_STYLES.length)
  })

  it('cada estilo tiene nombre, descripción, consejo e ícono, y modificadores razonables', () => {
    for (const s of RIVAL_STYLES) {
      expect(s.label.length).toBeGreaterThan(3)
      expect(s.desc.length).toBeGreaterThan(10)
      expect(s.tip.length).toBeGreaterThan(10)
      expect(s.icon).toBeTruthy()
      for (const v of Object.values(s.mods)) { expect(v).toBeGreaterThan(0.5); expect(v).toBeLessThan(2) }
    }
  })

  it('los modificadores que faltan quedan neutros', () => {
    expect(stylesToMods(null)).toEqual(NEUTRAL_STYLE)
    expect(stylesToMods({ corner: 2 })).toEqual({ ...NEUTRAL_STYLE, corner: 2 })
    expect(stylesToMods(RIVAL_STYLES[0]).corner).toBeGreaterThan(1)
  })
})
