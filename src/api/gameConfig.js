import { supabase } from './supabase'

/**
 * Cache for game config to avoid constant DB queries
 */
let configCache = null
let lastFetchTime = 0
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

export const gameConfigApi = {
  /**
   * Fetch all configurations
   * @param {boolean} forceRefresh - If true, bypass cache
   * @returns {Promise<Object>} Map of key-value configs
   */
  async getAll(forceRefresh = false) {
    if (!forceRefresh && configCache && (Date.now() - lastFetchTime < CACHE_TTL)) {
      return configCache
    }

    const { data, error } = await supabase
      .from('game_config')
      .select('key, value')

    if (error) throw new Error(error.message)

    // Convert array to Map-like object
    const configMap = {}
    data.forEach(item => {
      configMap[item.key] = item.value
    })

    configCache = configMap
    lastFetchTime = Date.now()

    return configMap
  },

  /**
   * Get a specific configuration value
   * @param {string} key 
   * @param {any} defaultValue 
   * @returns {Promise<any>}
   */
  async get(key, defaultValue = null) {
    const configs = await this.getAll()
    return configs[key] !== undefined ? configs[key] : defaultValue
  },

  /**
   * Get a numeric config
   */
  async getNumber(key, defaultValue = 0) {
    const val = await this.get(key)
    return val !== null ? Number(val) : defaultValue
  }
}
