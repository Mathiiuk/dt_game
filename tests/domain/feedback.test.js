import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { feel, playTone, setSoundEnabled, soundEnabled, vibrate, TONES } from '../../src/lib/feedback'

describe('vibración y sonido', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it('el sonido arranca apagado y la elección queda guardada', () => {
    expect(soundEnabled()).toBe(false)
    setSoundEnabled(true)
    expect(soundEnabled()).toBe(true)
    setSoundEnabled(false)
    expect(soundEnabled()).toBe(false)
  })

  it('vibra con el patrón pedido y no falla si el dispositivo no vibra', () => {
    const spy = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true })
    vibrate([10, 20])
    expect(spy).toHaveBeenCalledWith([10, 20])
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true })
    expect(() => vibrate(10)).not.toThrow()
  })

  it('con el sonido apagado no crea audio, y con el sonido encendido toca las notas del tono', () => {
    const created = []
    class FakeAudio {
      constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; created.push(this) }
      createOscillator() { return { frequency: {}, connect() { return { connect() {} } }, start() {}, stop() {} } }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return {} } } }
    }
    vi.stubGlobal('AudioContext', FakeAudio)
    window.AudioContext = FakeAudio
    playTone('good')
    expect(created).toHaveLength(0)
    setSoundEnabled(true)
    expect(() => playTone('good')).not.toThrow()
    expect(created.length).toBeGreaterThan(0)
    expect(() => playTone('inexistente')).not.toThrow()
  })

  it('todos los sonidos tienen notas válidas y feel junta vibración y sonido sin romper', () => {
    for (const notes of Object.values(TONES)) for (const [freq, dur] of notes) { expect(freq).toBeGreaterThan(100); expect(dur).toBeGreaterThan(0) }
    expect(() => feel('win')).not.toThrow()
    expect(() => feel('desconocido')).not.toThrow()
  })
})
