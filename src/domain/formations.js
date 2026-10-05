/**
 * Geometría de las formaciones sobre la cancha y reasignación automática de titulares.
 * Coordenadas en porcentaje: x de izquierda (0) a derecha (100); y de arriba (0, arco rival) a abajo (100, arco propio).
 * Funciones puras (sin React ni Supabase) para poder probarlas.
 */
import { ratingAtSlot, playerOverall } from './ratings'

const L = (slot, x, y) => ({ slot, x, y })

export const FORMATION_LAYOUTS = {
  '4-4-2': [
    L('PO', 50, 91), L('LI', 14, 72), L('DFC1', 37, 75), L('DFC2', 63, 75), L('LD', 86, 72),
    L('MI', 14, 48), L('MC1', 38, 52), L('MC2', 62, 52), L('MD', 86, 48), L('DC1', 37, 20), L('DC2', 63, 20)
  ],
  '4-3-3': [
    L('PO', 50, 91), L('LI', 14, 72), L('DFC1', 37, 75), L('DFC2', 63, 75), L('LD', 86, 72),
    L('MCD', 50, 56), L('MC1', 29, 46), L('MC2', 71, 46), L('EI', 16, 22), L('DC', 50, 17), L('ED', 84, 22)
  ],
  '4-2-3-1': [
    L('PO', 50, 91), L('LI', 14, 72), L('DFC1', 37, 75), L('DFC2', 63, 75), L('LD', 86, 72),
    L('MCD1', 36, 58), L('MCD2', 64, 58), L('MI', 16, 36), L('MCO', 50, 36), L('MD', 84, 36), L('DC', 50, 15)
  ],
  '3-5-2': [
    L('PO', 50, 91), L('DFC1', 28, 75), L('DFC2', 50, 77), L('DFC3', 72, 75),
    L('LI', 10, 52), L('MC1', 34, 54), L('MC2', 66, 54), L('LD', 90, 52), L('MCO', 50, 38), L('DC1', 37, 18), L('DC2', 63, 18)
  ],
  '5-3-2': [
    L('PO', 50, 91), L('LI', 9, 66), L('DFC1', 30, 75), L('DFC2', 50, 77), L('DFC3', 70, 75), L('LD', 91, 66),
    L('MC1', 29, 48), L('MC2', 50, 52), L('MC3', 71, 48), L('DC1', 37, 20), L('DC2', 63, 20)
  ],
  '4-1-4-1': [
    L('PO', 50, 91), L('LI', 14, 72), L('DFC1', 37, 75), L('DFC2', 63, 75), L('LD', 86, 72),
    L('MCD', 50, 58), L('MI', 14, 40), L('MC1', 38, 43), L('MC2', 62, 43), L('MD', 86, 40), L('DC', 50, 16)
  ],
  '3-4-3': [
    L('PO', 50, 91), L('DFC1', 28, 75), L('DFC2', 50, 77), L('DFC3', 72, 75),
    L('MI', 13, 50), L('MC1', 38, 52), L('MC2', 62, 52), L('MD', 87, 50), L('EI', 18, 22), L('DC', 50, 17), L('ED', 82, 22)
  ]
}

/** Layout de una formación (cae en 4-4-2 si la clave no existe) */
export const getLayout = (formationKey) => FORMATION_LAYOUTS[formationKey] || FORMATION_LAYOUTS['4-4-2']

/** Mapa slot -> coordenadas */
export const slotCoords = (formationKey) => Object.fromEntries(getLayout(formationKey).map(p => [p.slot, { x: p.x, y: p.y }]))

const ovr = (p) => playerOverall(p)

/**
 * Reasigna titulares al cambiar de formación.
 * Prioriza a los que ya eran titulares (continuidad) y los ubica donde mejor rinden (media en el puesto);
 * si faltan, completa con el mejor candidato sano del resto del plantel (y como último recurso, con lesionados).
 * @param {string[]} slots puestos de la nueva formación (en orden)
 * @param {Array} squad plantel completo
 * @param {string[]} currentStarterIds titulares actuales
 * @returns {Object} { [slot]: playerId }
 */
export const reassignLineup = (slots, squad, currentStarterIds = []) => {
  const byId = new Map(squad.map(p => [p.id, p]))
  const current = currentStarterIds.map(id => byId.get(id)).filter(Boolean)
  const used = new Set()
  const result = {}

  // Todas las combinaciones (jugador titular actual x puesto) ordenadas por afinidad y luego por nivel
  const pairs = []
  for (const slot of slots) {
    for (const p of current) {
      pairs.push({ slot, p, rating: ratingAtSlot(p, slot) - (p.is_injured ? 30 : 0) })
    }
  }
  pairs.sort((a, b) => b.rating - a.rating || ovr(b.p) - ovr(a.p))
  for (const { slot, p } of pairs) {
    if (result[slot] || used.has(p.id)) continue
    result[slot] = p.id
    used.add(p.id)
  }

  // Huecos: mejor afinidad entre el resto del plantel (sanos primero)
  for (const slot of slots) {
    if (result[slot]) continue
    const candidates = squad
      .filter(p => !used.has(p.id) && !p.is_retired && !p.is_suspended)
      .map(p => ({ p, score: ratingAtSlot(p, slot) - (p.is_injured ? 60 : 0) }))
      .sort((a, b) => b.score - a.score || ovr(b.p) - ovr(a.p))
    if (candidates[0]) {
      result[slot] = candidates[0].p.id
      used.add(candidates[0].p.id)
    }
  }

  return result
}

/** Media del once según los puestos: { [slot]: idJugador } -> promedio de lo que rinde cada uno en su puesto */
const averageRating = (slots, map, byId) => {
  const rated = slots.map(sl => byId.get(map[sl])).map((p, i) => (p ? ratingAtSlot(p, slots[i]) : null)).filter(v => v !== null)
  return rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0
}

/**
 * Convierte la alineación guardada (lista de ids en el orden de los puestos) en { [puesto]: idJugador }.
 * Hay alineaciones viejas que se guardaron "los mejores 11" sin respetar el puesto de cada uno (un delantero en el arco):
 * si reubicar a los mismos 11 donde mejor rinden sube el nivel del once más de `tolerance` puntos, se usa esa ubicación.
 * Así una alineación elegida a propósito no se toca, pero una desordenada se corrige sola.
 */
export const resolveLineup = (slots, squad, savedIds = [], tolerance = 5) => {
  const byId = new Map(squad.map(p => [p.id, p]))
  const saved = {}
  const used = new Set()
  slots.forEach((slot, i) => {
    const id = savedIds[i]
    if (id && byId.has(id) && !used.has(id)) { saved[slot] = id; used.add(id) }
  })
  if (Object.keys(saved).length < slots.length) return reassignLineup(slots, squad, Object.values(saved))

  const best = reassignLineup(slots, squad, Object.values(saved))
  return averageRating(slots, best, byId) - averageRating(slots, saved, byId) > tolerance ? best : saved
}

