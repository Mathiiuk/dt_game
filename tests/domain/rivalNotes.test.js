import { describe, it, expect } from 'vitest'
import { NOTES_BY_SITUATION, NOTE_MINUTES, situationOf, tacticalNote } from '../../src/domain/rivalNotes'
import { RIVAL_STYLES } from '../../src/domain/rivalStyle'

describe('notas tácticas del rival según el marcador', () => {
  it('la situación sale del marcador del equipo con ese estilo', () => {
    expect(situationOf(2, 0)).toBe('LEADING')
    expect(situationOf(0, 1)).toBe('TRAILING')
    expect(situationOf(1, 1)).toBe('LEVEL')
  })

  it('todos los estilos tienen una nota para cada situación y cada momento', () => {
    for (const s of RIVAL_STYLES) {
      for (const sit of ['LEVEL', 'LEADING', 'TRAILING']) {
        expect(NOTES_BY_SITUATION[s.id][sit], `${s.id} ${sit}`).toHaveLength(NOTE_MINUTES.length)
      }
    }
  })

  it('la nota cambia con el marcador y con el momento del partido', () => {
    const level = tacticalNote('COUNTER', 65, 1, 1)
    const leading = tacticalNote('COUNTER', 65, 2, 1)
    const trailing = tacticalNote('COUNTER', 65, 0, 1)
    expect(new Set([level, leading, trailing]).size).toBe(3)
    expect(tacticalNote('COUNTER', 20, 0, 0)).not.toBe(tacticalNote('COUNTER', 80, 0, 0))
  })

  it('en un minuto sin nota o con un estilo desconocido no dice nada', () => {
    expect(tacticalNote('COUNTER', 33, 0, 0)).toBe('')
    expect(tacticalNote('INEXISTENTE', 20, 0, 0)).toBe('')
  })
})
