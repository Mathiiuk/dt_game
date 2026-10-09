import { describe, it, expect } from 'vitest'
import { speedOf, nextCombo, comboMoodBonus, comboLabel, COMBO_MOOD_CAP } from '../../src/domain/pressCombo'

describe('racha de reflejos en la prensa', () => {
  it('mide qué tan rápido se contestó', () => {
    expect(speedOf({ secondsLeft: 12, totalSeconds: 12 })).toBe('FAST')
    expect(speedOf({ secondsLeft: 8, totalSeconds: 12 })).toBe('FAST') // 66%
    expect(speedOf({ secondsLeft: 6, totalSeconds: 12 })).toBe('OK')
    expect(speedOf({ secondsLeft: 2, totalSeconds: 12 })).toBe('SLOW')
    expect(speedOf({ secondsLeft: 0, totalSeconds: 12, timedOut: true })).toBe('TIMEOUT')
  })

  it('sin cuenta regresiva no hay reflejos: no suma ni corta', () => {
    expect(speedOf({ secondsLeft: 12, totalSeconds: 12, timerOff: true })).toBe('OK')
    expect(speedOf({})).toBe('OK')
  })

  it('el combo sube con lo rápido, se corta con el tiempo agotado y lo demás lo deja igual', () => {
    expect(nextCombo(0, 'FAST')).toBe(1)
    expect(nextCombo(1, 'FAST')).toBe(2)
    expect(nextCombo(2, 'OK')).toBe(2)
    expect(nextCombo(2, 'SLOW')).toBe(2)
    expect(nextCombo(3, 'TIMEOUT')).toBe(0)
  })

  it('solo la respuesta rápida levanta el humor, más cuanto más largo el combo y con tope', () => {
    expect(comboMoodBonus(1, 'FAST')).toBe(6)
    expect(comboMoodBonus(2, 'FAST')).toBe(12)
    expect(comboMoodBonus(10, 'FAST')).toBe(COMBO_MOOD_CAP)
    expect(comboMoodBonus(3, 'OK')).toBe(0)
    expect(comboMoodBonus(0, 'FAST')).toBe(0)
  })

  it('el cartel acompaña la racha', () => {
    expect(comboLabel(0)).toBe('')
    expect(comboLabel(1)).toBe('¡Al toque!')
    expect(comboLabel(3)).toBe('Combo x3')
  })
})
