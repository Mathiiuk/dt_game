import { supabase } from './supabase'
import { playerApi } from './player'

export const clubApi = {
  async createClub(managerId, clubData) {
    const { identity, history, stadium } = clubData
    
    // Backend validation logic per Phase 03
    let budget = 0
    let wageBudget = 0
    let reputation = 10
    
    switch(history) {
      case 'barrio': 
        budget = 50000; wageBudget = 2000; reputation = 5; break;
      case 'familiar': 
        budget = 100000; wageBudget = 5000; reputation = 15; break;
      case 'trabajadores': 
        budget = 80000; wageBudget = 3000; reputation = 20; break;
      case 'decadencia': 
        budget = 20000; wageBudget = 10000; reputation = 40; break;
      case 'ambicioso': 
        budget = 500000; wageBudget = 20000; reputation = 10; break;
      default:
        budget = 50000; wageBudget = 2000; reputation = 10;
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .insert([
        {
          manager_id: managerId,
          name: identity.name,
          short_name: identity.shortName,
          city: identity.city,
          country: identity.country,
          founded_year: identity.foundedYear,
          colors: identity.colors,
          nickname: identity.nickname,
          history_type: history,
          budget,
          wage_budget: wageBudget,
          reputation,
          stadium_name: stadium.name,
          stadium_capacity: stadium.capacity
        }
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)
    
    // Generar el primer plantel automáticamente
    await playerApi.generateInitialSquad(club.id, club.reputation)
    
    return club
  },

  async getClubByManager(managerId) {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('manager_id', managerId)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  }
}
