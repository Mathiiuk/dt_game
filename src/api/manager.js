import { supabase } from './supabase'

export const managerApi = {
  async createManager(userId, managerData) {
    const { data: existingManager } = await supabase
      .from('managers')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingManager) {
      throw new Error('Ya tienes un perfil de Director Técnico creado.')
    }

    const { identity, attributes, philosophy } = managerData

    const { data, error } = await supabase
      .from('managers')
      .insert([
        {
          user_id: userId,
          level: 1,
          xp: 0,
          reputation: 10,
          first_name: identity.firstName,
          last_name: identity.lastName,
          age: identity.age,
          nationality: identity.nationality,
          city: identity.city,
          dominant_foot: identity.dominantFoot,
          philosophy: philosophy,
          attr_leadership: attributes.leadership,
          attr_tactics: attributes.tactics,
          attr_motivation: attributes.motivation,
          attr_management: attributes.management,
          attr_youth: attributes.youth,
          attr_negotiation: attributes.negotiation,
          attr_locker_room: attributes.lockerRoom
        }
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async getManager(userId) {
    const { data, error } = await supabase
      .from('managers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw new Error(error.message)
    }

    return data || null
  },

  async addXp(managerId, xpAmount) {
    const { levelsApi } = await import('./levels')
    
    // 1. Fetch current manager
    const { data: manager, error: fetchError } = await supabase
      .from('managers')
      .select('xp, level')
      .eq('id', managerId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const newXp = manager.xp + xpAmount
    
    const levelInfo = await levelsApi.getLevelInfo(newXp)
    const newLevel = levelInfo.currentLevel

    const { data: updatedManager, error: updateError } = await supabase
      .from('managers')
      .update({ xp: newXp, level: newLevel })
      .eq('id', managerId)
      .select()
      .single()

    if (updateError) throw new Error(updateError.message)

    return {
      manager: updatedManager,
      leveledUp: newLevel > manager.level
    }
  }
}
