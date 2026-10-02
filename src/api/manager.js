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
  }
}
