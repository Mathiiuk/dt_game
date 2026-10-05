/**
 * Alineación libre: cada jugador se ubica donde se quiera en la cancha y el puesto se deduce de la zona.
 * Coordenadas en porcentaje: x de izquierda (0) a derecha (100); y de arriba (0, arco rival) a abajo (100, arco propio).
 * Funciones puras para poder probarlas sin React.
 */

export const FREE_FORMATION = 'LIBRE'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/** Límites donde puede quedar una ficha (los arqueros viven en la zona del arco propio) */
export const PITCH_LIMITS = { minX: 4, maxX: 96, minY: 5, maxY: 95, keeperMinY: 86, outfieldMaxY: 84 }

/** Puesto que corresponde a un punto de la cancha */
export function roleAtPoint(x, y) {
  if (y >= 85) return 'PO'
  if (y >= 62) return x < 24 ? 'LI' : x > 76 ? 'LD' : 'DFC'
  if (y >= 54) return x < 24 ? 'MI' : x > 76 ? 'MD' : 'MCD'
  if (y >= 42) return x < 22 ? 'MI' : x > 78 ? 'MD' : 'MC'
  if (y >= 30) return x < 22 ? 'MI' : x > 78 ? 'MD' : 'MCO'
  return x < 28 ? 'EI' : x > 72 ? 'ED' : 'DC'
}

const round = (v) => Math.round(v * 10) / 10

/**
 * Deja un punto dentro de lo permitido. El arquero se mueve solo dentro de su área; el resto de los jugadores no puede
 * entrar a ella, así siempre hay un único arquero.
 */
export function clampPoint(x, y, isKeeper = false) {
  const px = clamp(x, PITCH_LIMITS.minX, PITCH_LIMITS.maxX)
  if (isKeeper) return { x: round(clamp(px, 30, 70)), y: round(clamp(y, PITCH_LIMITS.keeperMinY, PITCH_LIMITS.maxY)) }
  return { x: round(px), y: round(clamp(y, PITCH_LIMITS.minY, PITCH_LIMITS.outfieldMaxY)) }
}

/**
 * Arma el layout con ids de puesto únicos a partir de puntos { x, y, id }: los puestos repetidos se numeran de
 * izquierda a derecha (DFC1, DFC2...). Orden: arquero, y de la defensa al ataque. Devuelve { layout, lineup, slotOf }
 * donde `slotOf(index)` da el puesto del punto que estaba en esa posición del arreglo original.
 */
export function buildFreeLayout(points) {
  const withRole = points.map((p, index) => ({ ...p, index, role: roleAtPoint(p.x, p.y) }))
  const byRole = {}
  for (const p of withRole) (byRole[p.role] ||= []).push(p)

  const slotByIndex = {}
  for (const [role, list] of Object.entries(byRole)) {
    const sorted = [...list].sort((a, b) => a.x - b.x || a.y - b.y)
    sorted.forEach((p, i) => { slotByIndex[p.index] = sorted.length > 1 ? `${role}${i + 1}` : role })
  }

  const ordered = [...withRole].sort((a, b) => (a.role === 'PO' ? -1 : 0) - (b.role === 'PO' ? -1 : 0) || b.y - a.y || a.x - b.x)
  const layout = ordered.map(p => ({ slot: slotByIndex[p.index], x: p.x, y: p.y }))
  const lineup = {}
  for (const p of ordered) if (p.id) lineup[slotByIndex[p.index]] = p.id
  return { layout, lineup, slotOf: (index) => slotByIndex[index] }
}

/** Puntos { x, y, id } de un layout y su alineación */
export const pointsFrom = (layout, lineup) => layout.map(p => ({ x: p.x, y: p.y, id: lineup[p.slot] || null }))

/**
 * Mueve la ficha de `slot` a (x, y). Devuelve el layout y la alineación nuevos, y el puesto que quedó ocupando la ficha
 * (puede cambiar de nombre si pasa de una zona a otra).
 */
export function moveToPoint(layout, lineup, slot, x, y) {
  const index = layout.findIndex(p => p.slot === slot)
  if (index === -1) return { layout, lineup, slot }
  const isKeeper = layout[index].slot === 'PO'
  const target = clampPoint(x, y, isKeeper)
  const points = pointsFrom(layout, lineup)
  points[index] = { ...points[index], ...target }
  const built = buildFreeLayout(points)
  return { layout: built.layout, lineup: built.lineup, slot: built.slotOf(index) }
}

/** Línea de cada puesto para describir el esquema */
const LINE_OF = { LI: 'DEF', LD: 'DEF', DFC: 'DEF', MI: 'MED', MD: 'MED', MC: 'MED', MCD: 'MED', MCO: 'MED', EI: 'DEL', ED: 'DEL', DC: 'DEL' }

const baseOf = (slot) => String(slot).replace(/\d+$/, '')

/** Esquema del once, por ejemplo "4-3-3" (defensores-mediocampistas-delanteros, sin el arquero) */
export function shapeOf(layout) {
  const count = { DEF: 0, MED: 0, DEL: 0 }
  for (const p of layout) {
    const line = LINE_OF[baseOf(p.slot)]
    if (line) count[line]++
  }
  return `${count.DEF}-${count.MED}-${count.DEL}`
}

/** Un layout libre es válido con 11 puntos, un único arquero y coordenadas dentro de la cancha */
export function isValidFreeLayout(layout) {
  if (!Array.isArray(layout) || layout.length !== 11) return false
  if (layout.filter(p => baseOf(p?.slot) === 'PO').length !== 1) return false
  const slots = new Set(layout.map(p => p.slot))
  if (slots.size !== 11) return false
  return layout.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100)
}

/** Layout guardado en la base: se devuelve limpio o null si no sirve (se cae a la formación fija) */
export function normalizeLayout(raw) {
  if (!Array.isArray(raw)) return null
  const clean = raw.map(p => ({ slot: String(p?.slot), x: Number(p?.x), y: Number(p?.y) }))
  return isValidFreeLayout(clean) ? clean : null
}

/** Puestos de un layout en orden (el orden en que se guarda la alineación) */
export const slotsOfLayout = (layout) => layout.map(p => p.slot)
