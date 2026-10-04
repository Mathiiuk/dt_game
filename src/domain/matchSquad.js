/**
 * Armado del once que sale a la cancha.
 * Regla (decidida con el usuario): un partido NUNCA queda bloqueado por falta de jugadores aptos.
 *   1. Titulares elegidos por el DT que estén aptos.
 *   2. Se completa con los mejores aptos del plantel.
 *   3. Si aún faltan, se convocan juveniles de la cantera (rendimiento bajo, sin riesgo).
 *   4. Si todavía faltan, juegan lesionados: -20% de rendimiento, fitness tope 50 y riesgo de agravar la lesión.
 * Funciones puras: sin Supabase, sin azar (el azar se inyecta en las rutinas que lo necesitan).
 */

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
export const makeYouthCallup = (index, position = 'MED') => ({
  id: `youth_callup_${index}`,
  first_name: 'Juvenil',
  last_name: `de Reserva #${index + 1}`,
  position,
  age: 17,
  state_fitness: 90,
  attr_pace: 42, attr_shooting: 38, attr_finishing: 38, attr_passing: 40, attr_defending: 38,
  attr_overall: 40,
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
 * @param {Array} players plantel completo
 * @param {Array<string>} lineupIds ids elegidos por el DT en la pizarra (puede estar vacío)
 * @returns {{ starters: Array, notes: Array, injuredPlayingIds: string[], youthCallupCount: number, healthyCount: number }}
 */
export const buildMatchSquad = (players = [], lineupIds = [], size = MATCH_SQUAD_SIZE) => {
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

  return { starters, notes, injuredPlayingIds, youthCallupCount, healthyCount }
}

/**
 * Decide qué lesionados que jugaron agravan su lesión.
 * @param {string[]} injuredPlayedIds
 * @param {() => number} rng devuelve [0,1)
 * @returns {string[]} ids que empeoran
 */
export const rollAggravations = (injuredPlayedIds = [], rng = Math.random) =>
  injuredPlayedIds.filter(() => rng() < INJURED_AGGRAVATION_CHANCE)
