// Racha de reflejos en la prensa: contestar rápido seguido arma un combo que levanta el humor de la sala.
// Reglas puras. Es un premio de ambiente: no toca moral, hinchada ni dirigencia (eso lo deciden el tono y el resultado).

export const FAST_RATIO = 0.6 // quedaba el 60% del tiempo o más
export const SLOW_RATIO = 0.25 // quedaba menos del 25%: contestó con lo justo
export const COMBO_MOOD_STEP = 6
export const COMBO_MOOD_CAP = 18

/** Qué tan rápido contestó: FAST, OK, SLOW o TIMEOUT. Sin cuenta regresiva no hay reflejos que medir (OK). */
export function speedOf({ secondsLeft, totalSeconds, timedOut = false, timerOff = false } = {}) {
  if (timedOut) return 'TIMEOUT'
  if (timerOff || !totalSeconds || secondsLeft == null) return 'OK'
  const ratio = secondsLeft / totalSeconds
  if (ratio >= FAST_RATIO) return 'FAST'
  if (ratio < SLOW_RATIO) return 'SLOW'
  return 'OK'
}

/** El combo sube con cada respuesta rápida, se corta si se agota el tiempo y lo demás lo deja como está */
export function nextCombo(combo = 0, speed = 'OK') {
  if (speed === 'FAST') return combo + 1
  if (speed === 'TIMEOUT') return 0
  return combo
}

/** Puntos de humor de la sala que suma una respuesta rápida: más cuanto más largo el combo, con tope */
export const comboMoodBonus = (combo = 0, speed = 'OK') => (speed === 'FAST' ? Math.min(COMBO_MOOD_CAP, COMBO_MOOD_STEP * combo) : 0)

/** El cartel que ve el DT: nada si no hay racha, "¡Al toque!" con una rápida y "Combo xN" desde la segunda */
export function comboLabel(combo = 0) {
  if (combo <= 0) return ''
  return combo === 1 ? '¡Al toque!' : `Combo x${combo}`
}
