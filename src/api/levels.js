import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const levelsApi = {
  async getAllLevels() {
    return queryCache.fetch('static:level_config', async () => {
      const { data, error } = await supabase
        .from('level_config')
        .select('*')
        .order('level', { ascending: true })

      if (error) throw new Error(error.message)
      return data || []
    }, 3600000) // 1 hora de caché para configuración estática de niveles
  },

  async getLevelInfo(xp) {
    const levels = await this.getAllLevels()
    
    let currentLevel = levels[0]
    let nextLevel = levels[1]

    for (let i = 0; i < levels.length; i++) {
      if (xp >= levels[i].xp_required) {
        currentLevel = levels[i]
        nextLevel = levels[i + 1] || null // null si es el nivel maximo
      } else {
        break
      }
    }

    // Calcular progreso al siguiente nivel
    let progressPercent = 100
    if (nextLevel) {
      const xpIntoCurrentLevel = xp - currentLevel.xp_required
      const xpNeededForNext = nextLevel.xp_required - currentLevel.xp_required
      progressPercent = (xpIntoCurrentLevel / xpNeededForNext) * 100
    }

    return {
      currentLevel: currentLevel.level,
      nextLevel: nextLevel ? nextLevel.level : null,
      xp,
      xpRequiredForNext: nextLevel ? nextLevel.xp_required : currentLevel.xp_required,
      progressPercent: Math.min(100, Math.max(0, progressPercent)),
      unlocks: currentLevel.unlocks
    }
  }
}
