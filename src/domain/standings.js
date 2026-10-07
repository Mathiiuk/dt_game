/**
 * Lógica pura de la tabla de posiciones: zonas, diferencia de gol y racha.
 */
import { BOTTOM_TIER, PROMOTED_SPOTS, RELEGATED_SPOTS, TOP_TIER } from './pyramid'

export const ZONES = {
  PROMOTION: { id: 'PROMOTION', label: 'Ascenso directo', border: 'border-l-accent', dot: 'bg-accent' },
  RELEGATION: { id: 'RELEGATION', label: 'Zona de descenso', border: 'border-l-danger', dot: 'bg-danger' },
  NONE: { id: 'NONE', label: '', border: 'border-l-transparent', dot: '' }
}

const hasPromotion = (tier) => tier > TOP_TIER
// En tablas muy chicas (pruebas, ligas incompletas) no se marca descenso
const hasRelegation = (tier, total) => tier < BOTTOM_TIER && total > 8

/**
 * Zona de la posición `pos` (1 = líder) en una tabla de `total` clubes de la división `tier`.
 * Sale de las mismas reglas que el cierre de temporada (domain/pyramid): suben los dos primeros salvo en Primera
 * y bajan los tres últimos salvo en la última división.
 */
export const zoneOf = (pos, total, tier = BOTTOM_TIER) => {
  if (hasPromotion(tier) && pos <= PROMOTED_SPOTS) return ZONES.PROMOTION
  if (hasRelegation(tier, total) && pos > total - RELEGATED_SPOTS) return ZONES.RELEGATION
  return ZONES.NONE
}

/** Referencias que corresponden a la división: [zona, rango de puestos] */
export const zoneLegend = (tier = BOTTOM_TIER, total = 20) => {
  const legend = []
  if (hasPromotion(tier)) legend.push([ZONES.PROMOTION, `1º - ${PROMOTED_SPOTS}º`])
  if (hasRelegation(tier, total)) legend.push([ZONES.RELEGATION, `últimos ${RELEGATED_SPOTS}`])
  return legend
}

export const goalDiff = (s) => (s.goals_for || 0) - (s.goals_against || 0)

export const formatDiff = (n) => (n > 0 ? `+${n}` : String(n))

/** Racha "V,E,D" -> hasta 5 resultados; sin datos devuelve lista vacía */
export const parseForm = (form) => String(form || '').split(',').map(f => f.trim()).filter(Boolean).slice(0, 5)

export const FORM_LABELS = { V: 'Victoria', E: 'Empate', D: 'Derrota' }
