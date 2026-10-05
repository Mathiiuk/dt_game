/**
 * Lógica pura del Salón de la Fama: filtros del ranking y podio.
 */

export const HOF_FILTERS = [
  { value: 'all', label: 'Todas las leyendas' },
  { value: 'human', label: 'Tus carreras' },
  { value: 'titles', label: '+10 títulos' }
]

export const MIN_TITLES_LEGEND = 10

export const filterRanking = (ranking, filter = 'all') =>
  ranking.filter(entry => {
    if (filter === 'human') return !!entry.is_human
    if (filter === 'titles') return (entry.titles_count || 0) >= MIN_TITLES_LEGEND
    return true
  })

export const PODIUM = [
  { place: 1, label: '1º puesto', tone: 'text-gold' },
  { place: 2, label: '2º puesto', tone: 'text-fg-muted' },
  { place: 3, label: '3º puesto', tone: 'text-warning' }
]

export const splitPodium = (list) => ({ top: list.slice(0, 3), rest: list.slice(3) })
