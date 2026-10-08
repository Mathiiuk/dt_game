/**
 * Armado del once que sale a la cancha.
 * Regla (decidida con el usuario): un partido NUNCA queda bloqueado por falta de jugadores aptos.
 *   1. Titulares elegidos por el DT que estén aptos.
 *   2. Se completa con los mejores aptos del plantel.
 *   3. Si aún faltan, se convocan juveniles de la cantera (rendimiento bajo, sin riesgo).
 *   4. Si todavía faltan, juegan lesionados: -20% de rendimiento, fitness tope 50 y riesgo de agravar la lesión.
 * Funciones puras: sin Supabase, sin azar (el azar se inyecta en las rutinas que lo necesitan).
 */

import { ratingAtSlot } from './ratings'
import { positionLine, slotBase } from './positions'
import { rivalNames } from './rivalNames'

export const MATCH_SQUAD_SIZE = 11
export const MAX_YOUTH_CALLUPS = 4
export const INJURED_PERFORMANCE_FACTOR = 0.8
export const INJURED_FITNESS_CAP = 50
export const INJURED_AGGRAVATION_CHANCE = 0.35
export const AGGRAVATION_EXTRA_WEEKS = 2

const ATTRS_AFFECTED = ['attr_pace', 'attr_shooting', 'attr_finishing', 'attr_passing', 'attr_defending']

export const isAvailable = (p) => !p.is_injured && !p.is_suspended && !p.is_retired

const rating = (p) => p.attr_overall || p.overall || 50

/** Juvenil de cantera convocado de urgencia (no se persiste en la base) */
export const makeYouthCallup = (index, position = 'MC') => ({
  id: `youth_callup_${index}`,
  first_name: 'Juvenil',
  last_name: `de Reserva #${index + 1}`,
  position,
  age: 17,
  state_fitness: 90,
  attr_pace: 42, attr_shooting: 38, attr_finishing: 38, attr_passing: 40, attr_defending: 38,
  attr_overall: 45,
  isYouthCallup: true
})

/** Aplica la penalización de jugar lesionado sobre una copia del jugador */
export const withInjuryPenalty = (p) => {
  const out = { ...p, playingInjured: true, state_fitness: Math.min(p.state_fitness ?? INJURED_FITNESS_CAP, INJURED_FITNESS_CAP) }
  for (const k of ATTRS_AFFECTED) {
    if (typeof p[k] === 'number') out[k] = Math.round(p[k] * INJURED_PERFORMANCE_FACTOR)
  }
  return out
}

/**
 * Ubica a los 11 en los puestos de la formación. Cada titular del DT conserva el puesto que le dio en la pizarra;
 * los que entran de reemplazo (o los que quedaron sin su puesto) van a los puestos libres donde mejor rinden.
 * Cada uno sale con `slot`, `slot_base` y `slot_rating` (su media EN ESE puesto: fuera de posición rinde menos).
 * @returns {Array} los titulares ordenados como `slots`
 */
export const assignToSlots = (starters, slots, lineupIds = []) => {
  const assigned = new Map()
  const byId = new Map(starters.map(p => [p.id, p]))
  const placed = new Set()

  // Los titulares elegidos por el DT mantienen su puesto
  slots.forEach((slot, i) => {
    const p = byId.get(lineupIds[i])
    if (p && !placed.has(p.id)) { assigned.set(slot, p); placed.add(p.id) }
  })

  // El resto, a los puestos libres: primero las mejores combinaciones jugador-puesto
  const freeSlots = slots.filter(sl => !assigned.has(sl))
  const rest = starters.filter(p => !placed.has(p.id))
  const pairs = []
  for (const sl of freeSlots) for (const p of rest) pairs.push({ sl, p, r: p.isYouthCallup ? 45 : ratingAtSlot(p, sl) })
  pairs.sort((a, b) => b.r - a.r)
  for (const { sl, p } of pairs) {
    if (assigned.has(sl) || placed.has(p.id)) continue
    assigned.set(sl, p)
    placed.add(p.id)
  }

  return slots.map(slot => {
    const p = assigned.get(slot)
    if (!p) return null
    // El juvenil de reserva no tiene puesto propio: juega donde hace falta
    const player = p.isYouthCallup ? { ...p, position: slotBase(slot) } : p
    const penalty = p.playingInjured ? INJURED_PERFORMANCE_FACTOR : 1
    return { ...player, slot, slot_base: slotBase(slot), slot_rating: Math.max(1, Math.round(ratingAtSlot(player, slot) * penalty)) }
  }).filter(Boolean)
}

/**
 * @param {Array} players plantel completo
 * @param {Array<string>} lineupIds ids elegidos por el DT en la pizarra (puede estar vacío)
 * @param {number} size cantidad de titulares
 * @param {Array<string>} [slots] puestos de la formación, en el mismo orden que `lineupIds` (si se pasan, los titulares salen con su puesto y su media en él)
 * @returns {{ starters: Array, notes: Array, injuredPlayingIds: string[], youthCallupCount: number, healthyCount: number }}
 */
export const buildMatchSquad = (players = [], lineupIds = [], size = MATCH_SQUAD_SIZE, slots = null) => {
  const byId = new Map(players.map(p => [p.id, p]))
  const starters = []
  const used = new Set()
  const notes = []
  const take = (p) => { starters.push(p); used.add(p.id) }

  // 1. Titulares del DT que estén aptos
  for (const id of lineupIds || []) {
    const p = byId.get(id)
    if (p && isAvailable(p) && !used.has(p.id) && starters.length < size) take(p)
  }

  // 2. Completar con los mejores aptos
  const healthy = players.filter(p => isAvailable(p) && !used.has(p.id)).sort((a, b) => rating(b) - rating(a))
  for (const p of healthy) {
    if (starters.length >= size) break
    take(p)
  }
  const healthyCount = starters.length

  // 3. Juveniles de la cantera (hasta MAX_YOUTH_CALLUPS)
  let youthCallupCount = 0
  while (starters.length < size && youthCallupCount < MAX_YOUTH_CALLUPS) {
    const youth = makeYouthCallup(youthCallupCount)
    take(youth)
    notes.push({ type: 'YOUTH_CALLUP', playerId: youth.id, name: `${youth.first_name} ${youth.last_name}` })
    youthCallupCount++
  }

  // 4. Lesionados (los de menor gravedad primero) con penalización
  const injuredPlayingIds = []
  if (starters.length < size) {
    const injured = players
      .filter(p => p.is_injured && !p.is_suspended && !p.is_retired && !used.has(p.id))
      .sort((a, b) => (a.injury_days || 0) - (b.injury_days || 0))
    for (const p of injured) {
      if (starters.length >= size) break
      take(withInjuryPenalty(p))
      injuredPlayingIds.push(p.id)
      notes.push({ type: 'INJURED_PLAYING', playerId: p.id, name: `${p.first_name} ${p.last_name}` })
    }
  }

  // 5. Último recurso (plantel casi inexistente): más juveniles hasta completar el once
  while (starters.length < size) {
    const youth = makeYouthCallup(youthCallupCount)
    take(youth)
    notes.push({ type: 'YOUTH_CALLUP', playerId: youth.id, name: `${youth.first_name} ${youth.last_name}` })
    youthCallupCount++
  }

  const placed = slots && slots.length === starters.length ? assignToSlots(starters, slots, lineupIds || []) : starters
  return { starters: placed, notes, injuredPlayingIds, youthCallupCount, healthyCount }
}

const RIVAL_SLOTS = ['PO', 'LI', 'DFC1', 'DFC2', 'LD', 'MI', 'MC1', 'MC2', 'MD', 'DC1', 'DC2']

/**
 * Once rival genérico para una liga sin planteles de IA: 4-4-2 donde todos rinden `50 + reputación / 2` en su puesto
 * (con reputación 15, 57: un poco por debajo de un plantel inicial del usuario, que ronda 60).
 */
const seedNumber = (seed) => { let h = 7; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

// Perfil de atributos por línea: cuánto se suma o resta al nivel del equipo en cada atributo (un delantero define mejor, un zaguero cabecea y marca)
const RIVAL_PROFILE = {
  ARQ: { attr_pace: -12, attr_strength: 0, attr_passing: -10, attr_vision: -10, attr_finishing: -30, attr_shooting: -30, attr_heading: -10, attr_defending: 6, attr_positioning: 8 },
  DEF: { attr_pace: -2, attr_strength: 7, attr_passing: -3, attr_vision: -6, attr_finishing: -14, attr_shooting: -12, attr_heading: 8, attr_defending: 10, attr_positioning: 4 },
  MED: { attr_pace: 0, attr_strength: -2, attr_passing: 8, attr_vision: 8, attr_finishing: -4, attr_shooting: 0, attr_heading: -6, attr_defending: -2, attr_positioning: 2 },
  DEL: { attr_pace: 6, attr_strength: 2, attr_passing: -4, attr_vision: -2, attr_finishing: 10, attr_shooting: 9, attr_heading: 4, attr_defending: -16, attr_positioning: 6 }
}
const clampAttr = (n) => Math.max(20, Math.min(95, Math.round(n)))

/**
 * Atributos del once rival: salen del perfil de su línea y de un "carácter" propio de cada jugador (±9 de ruido fijo por club),
 * así cada rival tiene sus especialistas de pelota parada. No cambian lo que rinde el equipo (eso lo marca `slot_rating`).
 */
export const rivalAttributes = (level, line, base, idx) => {
  const profile = RIVAL_PROFILE[line] || RIVAL_PROFILE.MED
  return Object.fromEntries(Object.entries(profile).map(([key, offset]) => {
    const noise = ((seedNumber(`${base}:${idx}:${key}`) % 19) - 9)
    return [key, clampAttr(level + offset + noise)]
  }))
}

export const buildRivalLineup = (reputation = 10, strength = null, seed = 'rival') => {
  // Con fuerza propia el rival rinde exactamente eso; si no la tiene, se estima por reputación
  const level = strength != null ? Math.round(strength) : Math.round(50 + reputation * 0.5)
  const base = seedNumber(seed)
  // Cada club y cada jugador tienen su nombre (siempre el mismo para el mismo club, sin repetirse dentro del equipo)
  const names = rivalNames(seed, RIVAL_SLOTS.length)
  return RIVAL_SLOTS.map((slot, idx) => ({
    id: `rival_${idx}`,
    ...names[idx],
    shirt_number: idx + 1,
    position: slotBase(slot),
    slot,
    slot_base: slotBase(slot),
    slot_rating: level,
    attr_overall: level,
    ...rivalAttributes(level, positionLine(slotBase(slot)), base, idx),
    state_fitness: 90
  }))
}

/**
 * Decide qué lesionados que jugaron agravan su lesión.
 * @param {string[]} injuredPlayedIds
 * @param {() => number} rng devuelve [0,1)
 * @returns {string[]} ids que empeoran
 */
export const rollAggravations = (injuredPlayedIds = [], rng = Math.random) =>
  injuredPlayedIds.filter(() => rng() < INJURED_AGGRAVATION_CHANCE)
