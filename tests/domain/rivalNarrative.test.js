import { describe, it, expect } from 'vitest'
import { STYLE_QUIPS, styleQuipFor } from '../../src/domain/rivalNarrative'
import { RIVAL_STYLES } from '../../src/domain/rivalStyle'

describe('relato según el estilo del rival', () => {
  it('todos los estilos tienen frases para goles, atajadas, errados y córners, ', () => {
    for (const s of RIVAL_STYLES) {
      for (const kind of ['GOAL', 'SAVE', 'MISS', 'CORNER']) expect(STYLE_QUIPS[s.id][kind].length).toBeGreaterThan(0)
    }
  })

  it('los duros tienen frases propias para las amarillas y la roja', () => {
    expect(STYLE_QUIPS.ROUGH.YELLOW.length).toBeGreaterThan(0)
    expect(STYLE_QUIPS.ROUGH.RED.length).toBeGreaterThan(0)
  })

  it('devuelve una frase del estilo, o nada si no corresponde', () => {
    expect(STYLE_QUIPS.CROSSERS.CORNER).toContain(styleQuipFor('CROSSERS', 'CORNER', () => 0))
    expect(styleQuipFor('CROSSERS', 'RED')).toBe('')
    expect(styleQuipFor('INEXISTENTE', 'GOAL')).toBe('')
  })

  it('todos los estilos tienen frases para pelotas paradas y penales', () => {
    for (const s of RIVAL_STYLES) {
      for (const kind of ['SETPIECE_CORNER', 'SETPIECE_FK', 'PENALTY', 'PENALTY_GOAL', 'PENALTY_MISS', 'FK_GOAL', 'FK_SAVE', 'FK_MISS']) {
        expect(STYLE_QUIPS[s.id][kind]?.length, `${s.id} ${kind}`).toBeGreaterThan(0)
      }
      // y conservan las de las jugadas normales
      expect(STYLE_QUIPS[s.id].GOAL.length).toBeGreaterThan(0)
    }
  })
})
