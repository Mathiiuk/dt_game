/**
 * Lógica pura de la tabla de posiciones: zonas, diferencia de gol y racha.
 */

export const ZONES = {
  PROMOTION: { id: 'PROMOTION', label: 'Ascenso directo', border: 'border-l-accent', dot: 'bg-accent' },
  PLAYOFF: { id: 'PLAYOFF', label: 'Reducido / playoff', border: 'border-l-gold', dot: 'bg-gold' },
  RELEGATION: { id: 'RELEGATION', label: 'Zona de descenso', border: 'border-l-danger', dot: 'bg-danger' },
  NONE: { id: 'NONE', label: '', border: 'border-l-transparent', dot: '' }
}

/** Zona de la posición `pos` (1 = líder) en una tabla de `total` clubes: 1-2 ascenso, 3-6 reducido, últimos 3 descenso */
export const zoneOf = (pos, total) => {
  if (pos <= 2) return ZONES.PROMOTION
  if (pos <= 6) return ZONES.PLAYOFF
  if (total > 8 && pos > total - 3) return ZONES.RELEGATION
  return ZONES.NONE
}

export const goalDiff = (s) => (s.goals_for || 0) - (s.goals_against || 0)

export const formatDiff = (n) => (n > 0 ? `+${n}` : String(n))

/** Racha "V,E,D" -> hasta 5 resultados; sin datos devuelve lista vacía */
export const parseForm = (form) => String(form || '').split(',').map(f => f.trim()).filter(Boolean).slice(0, 5)

export const FORM_LABELS = { V: 'Victoria', E: 'Empate', D: 'Derrota' }
