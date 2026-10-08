import { describe, it, expect } from 'vitest'
import { STYLE_QUIPS, STYLE_NOTES, styleQuipFor, styleNoteFor } from '../../src/domain/rivalNarrative'
import { RIVAL_STYLES } from '../../src/domain/rivalStyle'

describe('relato según el estilo del rival', () => {
  it('todos los estilos tienen frases para goles, atajadas, errados y córners, y dos notas tácticas', () => {
    for (const s of RIVAL_STYLES) {
      for (const kind of ['GOAL', 'SAVE', 'MISS', 'CORNER']) expect(STYLE_QUIPS[s.id][kind].length).toBeGreaterThan(0)
      expect(STYLE_NOTES[s.id]).toHaveLength(2)
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

  it('la nota del primer tiempo y la del segundo son distintas', () => {
    expect(styleNoteFor('COUNTER', 0)).not.toBe(styleNoteFor('COUNTER', 1))
    expect(styleNoteFor('INEXISTENTE', 0)).toBe('')
  })
})
