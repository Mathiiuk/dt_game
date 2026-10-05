/**
 * Geometría de las formaciones sobre la cancha y reasignación automática de titulares.
 * Coordenadas en porcentaje: x de izquierda (0) a derecha (100); y de arriba (0, arco rival) a abajo (100, arco propio).
 * Funciones puras (sin React ni Supabase) para poder probarlas.
 */
import { calculatePositionalAffinity } from '../api/tactics'

const L = (slot, x, y) => ({ slot, x, y })

export const FORMATION_LAYOUTS = {
  '4-4-2': [
    L('GK', 50, 91), L('LB', 14, 72), L('LCB', 37, 75), L('RCB', 63, 75), L('RB', 86, 72),
    L('LM', 14, 48), L('LCM', 38, 52), L('RCM', 62, 52), L('RM', 86, 48), L('LST', 37, 20), L('RST', 63, 20)
  ],
  '4-3-3': [
    L('GK', 50, 91), L('LB', 14, 72), L('LCB', 37, 75), L('RCB', 63, 75), L('RB', 86, 72),
    L('CDM', 50, 56), L('LCM', 29, 46), L('RCM', 71, 46), L('LW', 16, 22), L('ST', 50, 17), L('RW', 84, 22)
  ],
  '4-2-3-1': [
    L('GK', 50, 91), L('LB', 14, 72), L('LCB', 37, 75), L('RCB', 63, 75), L('RB', 86, 72),
    L('LDM', 36, 58), L('RDM', 64, 58), L('LM', 16, 36), L('CAM', 50, 36), L('RM', 84, 36), L('ST', 50, 15)
  ],
  '3-5-2': [
    L('GK', 50, 91), L('LCB', 28, 75), L('CB', 50, 77), L('RCB', 72, 75),
    L('LWB', 10, 52), L('LCM', 34, 54), L('RCM', 66, 54), L('RWB', 90, 52), L('CAM', 50, 38), L('LST', 37, 18), L('RST', 63, 18)
  ],
  '5-3-2': [
    L('GK', 50, 91), L('LWB', 9, 66), L('LCB', 30, 75), L('CB', 50, 77), L('RCB', 70, 75), L('RWB', 91, 66),
    L('LCM', 29, 48), L('CM', 50, 52), L('RCM', 71, 48), L('LST', 37, 20), L('RST', 63, 20)
  ],
  '4-1-4-1': [
    L('GK', 50, 91), L('LB', 14, 72), L('LCB', 37, 75), L('RCB', 63, 75), L('RB', 86, 72),
    L('CDM', 50, 58), L('LM', 14, 40), L('LCM', 38, 43), L('RCM', 62, 43), L('RM', 86, 40), L('ST', 50, 16)
  ],
  '3-4-3': [
    L('GK', 50, 91), L('LCB', 28, 75), L('CB', 50, 77), L('RCB', 72, 75),
    L('LM', 13, 50), L('LCM', 38, 52), L('RCM', 62, 52), L('RM', 87, 50), L('LW', 18, 22), L('ST', 50, 17), L('RW', 82, 22)
  ]
}

/** Layout de una formación (cae en 4-4-2 si la clave no existe) */
export const getLayout = (formationKey) => FORMATION_LAYOUTS[formationKey] || FORMATION_LAYOUTS['4-4-2']

/** Mapa slot -> coordenadas */
export const slotCoords = (formationKey) => Object.fromEntries(getLayout(formationKey).map(p => [p.slot, { x: p.x, y: p.y }]))

const ovr = (p) => p?.attr_overall || p?.overall || 50

/**
 * Reasigna titulares al cambiar de formación.
 * Prioriza a los que ya eran titulares (continuidad) y los ubica donde mejor afinidad posicional tienen;
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
      pairs.push({ slot, p, rating: calculatePositionalAffinity(p.position, slot).rating + (p.is_injured ? -0.5 : 0) })
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
      .map(p => ({ p, score: calculatePositionalAffinity(p.position, slot).rating + (p.is_injured ? -1 : 0) }))
      .sort((a, b) => b.score - a.score || ovr(b.p) - ovr(a.p))
    if (candidates[0]) {
      result[slot] = candidates[0].p.id
      used.add(candidates[0].p.id)
    }
  }

  return result
}
