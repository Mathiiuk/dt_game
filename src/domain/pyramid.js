// Pirámide de divisiones: 5 categorías de 20 clubes (1 = Primera). Los dos primeros suben y los tres últimos bajan.
// El movimiento del club del usuario y su presupuesto salarial los liquida la base (`settle_season_prize`); las cifras de acá
// son las mismas y los tests las comparan. Las ligas de otras categorías no se juegan: se arman con rivales de la fuerza que corresponde.
export const TOP_TIER = 1
export const BOTTOM_TIER = 5
export const TEAMS_PER_LEAGUE = 20
export const PROMOTED_SPOTS = 2
export const RELEGATED_SPOTS = 3

export const movementOf = (position, tier) => {
  if (position <= PROMOTED_SPOTS && tier > TOP_TIER) return 'PROMOTED'
  if (position > TEAMS_PER_LEAGUE - RELEGATED_SPOTS && tier < BOTTOM_TIER) return 'RELEGATED'
  return 'STAY'
}

/** Rango de fuerza de los clubes de una categoría: la quinta es 46 a 66 y cada escalón hacia arriba suma 4 */
export const tierStrengthRange = (tier) => {
  const step = (BOTTOM_TIER - tier) * 4
  return [46 + step, 66 + step]
}

export const wageFactorFor = (movement) => (movement === 'PROMOTED' ? 1.8 : movement === 'RELEGATED' ? 0.85 : 1.1)
