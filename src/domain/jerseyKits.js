/** Diseños de la camiseta titular del club (se guardan en `clubs.jersey_pattern`) */
export const JERSEY_PATTERNS = [
  { id: 'CENTER_STRIPE', label: 'Franja central' },
  { id: 'STRIPES_VERTICAL', label: 'Bastones' },
  { id: 'STRIPES_HORIZONTAL', label: 'Rayas horizontales' },
  { id: 'SASH', label: 'Banda cruzada' },
  { id: 'HALVES', label: 'Mitades' },
  { id: 'SOLID', label: 'Lisa' }
]

/** El diseño de siempre: los clubes creados antes de esta opción siguen viéndose igual */
export const DEFAULT_JERSEY_PATTERN = 'CENTER_STRIPE'

/** Valor guardado (puede ser nulo o desconocido) → diseño válido */
export const normalizeJerseyPattern = (value) => (JERSEY_PATTERNS.some(p => p.id === value) ? value : DEFAULT_JERSEY_PATTERN)
