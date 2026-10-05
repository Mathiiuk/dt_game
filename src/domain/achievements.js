/**
 * Lógica pura de la pantalla de Logros: filtros, resumen y rareza.
 */

export const ACHIEVEMENT_CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'matches', label: 'Partidos' },
  { value: 'titles', label: 'Títulos' },
  { value: 'management', label: 'Gestión' },
  { value: 'youth', label: 'Cantera' },
  { value: 'career', label: 'Carrera' }
]

export const ACHIEVEMENT_STATES = [
  { value: 'all', label: 'Todos' },
  { value: 'claimable', label: 'Por reclamar' },
  { value: 'completed', label: 'Completados' },
  { value: 'in_progress', label: 'En curso' }
]

export const RARITY = {
  legendary: { label: 'Legendario', tone: 'gold', border: 'border-gold/50' },
  epic: { label: 'Épico', tone: 'warning', border: 'border-warning/40' },
  rare: { label: 'Raro', tone: 'accent', border: 'border-accent/40' },
  common: { label: 'Común', tone: 'neutral', border: 'border-line' }
}

export const rarityOf = (rarity) => RARITY[rarity] || RARITY.common

export const isClaimable = (a) => !!a.is_unlocked && !a.is_claimed

/** Porcentaje de avance acotado a 0-100 */
export const progressPercent = (a) => Math.max(0, Math.min(100, Math.round(((a.current_progress || 0) / (a.target_progress || 1)) * 100)))

export const filterAchievements = (list, category = 'all', state = 'all') =>
  list.filter(a => {
    if (category !== 'all' && a.category !== category) return false
    if (state === 'claimable') return isClaimable(a)
    if (state === 'completed') return !!a.is_unlocked
    if (state === 'in_progress') return !a.is_unlocked
    return true
  })

export const summarizeAchievements = (list) => {
  const total = list.length
  const unlocked = list.filter(a => a.is_unlocked).length
  return {
    total,
    unlocked,
    claimable: list.filter(isClaimable).length,
    xpClaimed: list.filter(a => a.is_claimed).reduce((sum, a) => sum + (a.reward_xp || 0), 0),
    percent: total > 0 ? Math.round((unlocked / total) * 100) : 0
  }
}
