/**
 * Rivales de cada liga: se sortean de la tabla histórica de clubes argentinos por categoría (o del pozo general)
 * de forma determinista por carrera, para que cada carrera y cada división tenga sus propios rivales reales
 * con sus nombres, siglas, estadios, capacidades y colores tradicionales.
 */
import { seededRandom } from './cupMatch'
import { HISTORICAL_CLUBS_BY_TIER, ALL_HISTORICAL_CLUBS } from './historicalClubs'

export { HISTORICAL_CLUBS_BY_TIER, ALL_HISTORICAL_CLUBS }

/** Pozo de todos los clubes rivales disponibles en la pirámide */
export const RIVAL_POOL = ALL_HISTORICAL_CLUBS

/** Pozos categorizados por nivel (1 = Primera División, 5 = Torneo Regional / Potrero) */
export const TIER_RIVAL_POOLS = HISTORICAL_CLUBS_BY_TIER

/** Obtiene la lista completa de clubes de una categoría específica */
export function getClubsForTier(tier) {
  return HISTORICAL_CLUBS_BY_TIER[tier] || []
}

/**
 * `count` rivales distintos, siempre los mismos para la misma semilla y sin repetir nombres ni siglas.
 * Soporta opciones como objeto `{ tier, exclude }` o como argumentos posicionales `(seed, count, exclude, tier)`.
 * Si se especifica `tier`, prioriza los clubes de esa división.
 */
export function pickRivalClubs(seed, count = 19, excludeOrOptions = [], maybeTier = null) {
  let exclude = []
  let tier = maybeTier

  if (Array.isArray(excludeOrOptions)) {
    exclude = excludeOrOptions
  } else if (excludeOrOptions && typeof excludeOrOptions === 'object') {
    exclude = excludeOrOptions.exclude || []
    tier = excludeOrOptions.tier ?? maybeTier
  }

  const taken = new Set(exclude.map(n => String(n).toLowerCase().trim()))

  // Clonamos los objetos para evitar mutaciones accidentales en llamadas sucesivas
  let pool = []
  if (tier && HISTORICAL_CLUBS_BY_TIER[tier]) {
    pool = HISTORICAL_CLUBS_BY_TIER[tier]
      .filter(c => !taken.has(c.name.toLowerCase().trim()))
      .map(c => ({ ...c }))
  }

  // Si no se pasó categoría o el pozo de la categoría no alcanza para la cantidad pedida, completamos con el pozo general
  if (pool.length < count) {
    const extra = ALL_HISTORICAL_CLUBS
      .filter(c => !taken.has(c.name.toLowerCase().trim()) && !pool.some(p => p.name === c.name))
      .map(c => ({ ...c }))
    pool = [...pool, ...extra]
  }

  const rand = seededRandom(`rivals:${seed}`)
  // Fisher-Yates determinista con semilla
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, count)
}
