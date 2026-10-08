/**
 * Respuesta sensorial del juego: vibración (donde el dispositivo la tenga) y tonos cortos con WebAudio.
 * Todo es opcional y a prueba de fallos: sin soporte, no hace nada. El sonido se enciende y apaga desde la prensa
 * y la elección queda guardada en el navegador.
 */

const SOUND_KEY = 'game_sound'

const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null } }

export const soundEnabled = () => store()?.getItem(SOUND_KEY) === '1'

export function setSoundEnabled(on) {
  try { store()?.setItem(SOUND_KEY, on ? '1' : '0') } catch { /* sin almacenamiento sigue funcionando */ }
}

/** Vibra con un patrón corto (ms). En iPhone no hay vibración en el navegador: no pasa nada. */
export function vibrate(pattern = 12) {
  try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern) } catch { /* sin vibración */ }
}

// Cada sonido es una secuencia de notas: [frecuencia en Hz, duración en segundos]
export const TONES = {
  tap: [[520, 0.06]],
  pick: [[440, 0.07], [660, 0.09]],
  good: [[523, 0.09], [659, 0.09], [784, 0.14]],
  bad: [[330, 0.12], [247, 0.18]],
  win: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.18]],
  lose: [[392, 0.12], [294, 0.12], [220, 0.2]]
}

let audio = null

/** Toca un tono corto (si el sonido está encendido y el navegador lo permite) */
export function playTone(kind) {
  if (!soundEnabled()) return
  try {
    const Ctx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null
    const notes = TONES[kind]
    if (!Ctx || !notes) return
    audio = audio || new Ctx()
    if (audio.state === 'suspended') audio.resume?.()
    let t = audio.currentTime
    for (const [freq, dur] of notes) {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain).connect(audio.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
      t += dur
    }
  } catch { /* sin audio */ }
}

/** Vibración y sonido juntos para los momentos clave */
export function feel(kind) {
  const patterns = { tap: 8, pick: 14, good: [12, 40, 18], bad: [30, 50, 30], win: [10, 30, 10, 30, 24], lose: [40, 60, 40] }
  vibrate(patterns[kind] ?? 10)
  playTone(kind)
}
