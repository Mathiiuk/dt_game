/** Rasgos del retrato de un jugador: salen siempre de la misma semilla (id o nombre), así cada jugador mantiene su cara */
export const SKIN_TONES = ['#f1c9a5', '#e0ac82', '#c68a5c', '#a0683f', '#7a4a2b', '#5a3420']
export const HAIR_COLORS = ['#1c1410', '#3b2415', '#6b4423', '#a56a2a', '#d9b25f', '#8a2f1d']
export const HAIR_STYLES = ['corto', 'rulos', 'largo', 'rapado', 'jopo']
const GRAY = '#c9c9c9'

// Hash de texto → entero positivo estable (FNV-1a)
function hash(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

export function portraitOf(player) {
  const seed = String(player?.id ?? `${player?.first_name ?? ''} ${player?.last_name ?? ''}`.trim() ?? '')
  const h = hash(seed || 'jugador')
  const age = Number(player?.age) || 0
  const grayish = age >= 34 && (h >>> 20) % 3 === 0
  return {
    skin: SKIN_TONES[h % SKIN_TONES.length],
    hair: grayish ? GRAY : HAIR_COLORS[(h >>> 6) % HAIR_COLORS.length],
    style: HAIR_STYLES[(h >>> 12) % HAIR_STYLES.length],
    beard: age >= 24 && (h >>> 17) % 4 === 0
  }
}
