/**
 * Medias de los jugadores estilo FIFA (escala 50 a 99): cada posición pondera distinto los atributos.
 * Todo es puro y se comparte con la base (scripts/gen-rating-sql.cjs genera la función SQL desde estos mismos pesos).
 */
import { normalizePosition, positionPenalty, slotBase } from './positions.js'

export const RATING_MIN = 50
export const RATING_MAX = 99

/** Atributos que entran en la media (columnas attr_<nombre> de players) */
export const ATTRIBUTE_KEYS = [
  'pace', 'acceleration', 'strength', 'stamina', 'technique', 'passing', 'control', 'dribbling', 'finishing', 'shooting',
  'heading', 'marking', 'tackling', 'positioning', 'vision', 'decisions', 'mentality', 'concentration', 'leadership',
  'aggression', 'professionalism'
]

/** Pesos por posición (cada fila suma 1). Lo que no figura pesa 0. */
export const POSITION_WEIGHTS = {
  PO: { positioning: 0.30, concentration: 0.20, decisions: 0.15, mentality: 0.10, control: 0.05, strength: 0.05, vision: 0.05, passing: 0.05, acceleration: 0.05 },
  DFC: { marking: 0.22, tackling: 0.22, heading: 0.14, strength: 0.12, positioning: 0.10, concentration: 0.06, pace: 0.04, mentality: 0.04, decisions: 0.04, passing: 0.02 },
  LI: { pace: 0.14, acceleration: 0.08, tackling: 0.14, marking: 0.12, stamina: 0.12, passing: 0.10, technique: 0.08, dribbling: 0.06, positioning: 0.08, decisions: 0.04, strength: 0.04 },
  LD: { pace: 0.14, acceleration: 0.08, tackling: 0.14, marking: 0.12, stamina: 0.12, passing: 0.10, technique: 0.08, dribbling: 0.06, positioning: 0.08, decisions: 0.04, strength: 0.04 },
  MCD: { tackling: 0.18, marking: 0.14, positioning: 0.12, passing: 0.14, strength: 0.10, stamina: 0.10, decisions: 0.08, vision: 0.05, concentration: 0.05, control: 0.04 },
  MC: { passing: 0.18, vision: 0.14, control: 0.12, technique: 0.10, stamina: 0.12, decisions: 0.10, tackling: 0.06, shooting: 0.06, dribbling: 0.06, positioning: 0.06 },
  MCO: { vision: 0.18, passing: 0.16, technique: 0.14, dribbling: 0.12, control: 0.10, shooting: 0.10, decisions: 0.08, finishing: 0.06, acceleration: 0.06 },
  MI: { pace: 0.14, acceleration: 0.10, dribbling: 0.14, passing: 0.12, technique: 0.10, stamina: 0.12, vision: 0.08, shooting: 0.06, control: 0.08, decisions: 0.06 },
  MD: { pace: 0.14, acceleration: 0.10, dribbling: 0.14, passing: 0.12, technique: 0.10, stamina: 0.12, vision: 0.08, shooting: 0.06, control: 0.08, decisions: 0.06 },
  EI: { pace: 0.16, acceleration: 0.12, dribbling: 0.18, technique: 0.10, finishing: 0.12, shooting: 0.10, passing: 0.08, control: 0.08, vision: 0.06 },
  ED: { pace: 0.16, acceleration: 0.12, dribbling: 0.18, technique: 0.10, finishing: 0.12, shooting: 0.10, passing: 0.08, control: 0.08, vision: 0.06 },
  DC: { finishing: 0.24, shooting: 0.12, positioning: 0.10, heading: 0.10, strength: 0.10, control: 0.08, pace: 0.08, dribbling: 0.06, acceleration: 0.06, decisions: 0.06 }
}

const attr = (player, key) => {
  const v = player?.[`attr_${key}`]
  return typeof v === 'number' ? v : 50
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

/** Media de un jugador jugando en `position` (sin castigo por posición): suma ponderada de sus atributos */
export const calculateOverall = (player, position = player?.position) => {
  const weights = POSITION_WEIGHTS[normalizePosition(position)]
  let total = 0
  for (const [key, weight] of Object.entries(weights)) total += attr(player, key) * weight
  return clamp(Math.round(total), 1, RATING_MAX)
}

/** Media del jugador en su posición natural; usa la guardada (attr_overall) y recalcula sólo si falta */
export const playerOverall = (player) => {
  if (!player) return RATING_MIN
  return player.attr_overall || calculateOverall(player)
}

/**
 * Cómo rinde el jugador en un puesto de la cancha: su media para ESE puesto menos el castigo por jugar fuera de su posición.
 * Un delantero de lateral baja un poco; un arquero de delantero rinde una fracción mínima.
 */
export const ratingAtSlot = (player, slot) => {
  if (!player) return 1
  const base = slotBase(slot)
  const natural = normalizePosition(player.position)
  // En su puesto natural manda la media guardada; en otro, se calcula para ese puesto y se castiga
  const atPosition = natural === normalizePosition(base) ? playerOverall(player) : calculateOverall(player, base)
  return clamp(atPosition - positionPenalty(natural, base), 1, RATING_MAX)
}

/** Nivel medio de un once a partir de los jugadores y el puesto de cada uno ({ slot: jugador }) */
export const lineupRating = (assignments) => {
  const entries = Object.entries(assignments).filter(([, p]) => p)
  if (entries.length === 0) return 0
  return Math.round(entries.reduce((sum, [slot, p]) => sum + ratingAtSlot(p, slot), 0) / entries.length)
}

/**
 * Genera los atributos de un jugador para que su media en `position` sea (casi) `targetOverall`.
 * Los atributos que más pesan en la posición salen por encima del objetivo y los que no pesan, por debajo.
 * `rand` es una función 0-1 (Math.random en el juego, una semilla en los tests).
 */
export const generateAttributesForOverall = (targetOverall, position, rand = Math.random) => {
  const pos = normalizePosition(position)
  const weights = POSITION_WEIGHTS[pos]
  const maxW = Math.max(...Object.values(weights))
  const noise = () => (rand() - 0.5) * 8

  const values = {}
  for (const key of ATTRIBUTE_KEYS) {
    const w = weights[key] || 0
    const bias = (w / maxW - 0.45) * 22 // los clave suben hasta ~+12, los irrelevantes bajan ~-10
    values[key] = clamp(Math.round(targetOverall + bias + noise()), 25, 99)
  }

  // Calibración: ajusta de a poco para que la media ponderada caiga en el objetivo
  for (let i = 0; i < 6; i++) {
    const current = Object.entries(weights).reduce((sum, [key, w]) => sum + values[key] * w, 0)
    const delta = targetOverall - current
    if (Math.abs(delta) < 0.6) break
    for (const key of ATTRIBUTE_KEYS) values[key] = clamp(Math.round(values[key] + delta), 25, 99)
  }

  return Object.fromEntries(ATTRIBUTE_KEYS.map(k => [`attr_${k}`, values[k]]))
}

/** Franjas de media para la generación de jugadores de la división 5 (escala FIFA) */
export const TIER_5_RATING_RANGES = {
  prospect: [50, 54],
  young: [52, 57],
  prime: [54, 60],
  star: [62, 68],
  veteran: [56, 60]
}
