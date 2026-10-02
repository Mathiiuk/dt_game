import { supabase } from './supabase'
import { clubApi } from './club'

export const marketApi = {
  async getMarketPlayers(currentClubId, filters = {}) {
    // Buscar jugadores que no pertenezcan a nuestro club
    let query = supabase
      .from('players')
      .select('*, clubs(name, short_name)')
      .neq('club_id', currentClubId)
      
    if (filters.position) {
      query = query.eq('position', filters.position)
    }
    if (filters.minPace) {
      query = query.gte('attr_pace', filters.minPace)
    }
    
    // Limit to 50 for performance
    query = query.limit(50)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
  },

  async buyPlayer(clubId, playerId, price) {
    // 1. Obtener club comprador
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('budget')
      .eq('id', clubId)
      .single()
      
    if (clubErr) throw new Error(clubErr.message)
    if (club.budget < price) throw new Error('Presupuesto insuficiente')
    
    // 2. Restar presupuesto
    const newBudget = club.budget - price
    const { error: updateClubErr } = await supabase
      .from('clubs')
      .update({ budget: newBudget })
      .eq('id', clubId)
      
    if (updateClubErr) throw new Error(updateClubErr.message)
    
    // 3. Transferir jugador
    const { error: updatePlayerErr } = await supabase
      .from('players')
      .update({ club_id: clubId })
      .eq('id', playerId)
      
    if (updatePlayerErr) throw new Error(updatePlayerErr.message)
    
    return true
  },
  
  // Generar algunos agentes libres ficticios si el mercado está vacío (MVP)
  async generateFreeAgents(count = 10) {
     const positions = ['GK', 'DF', 'MD', 'FW']
     const names = ['Carlos', 'Juan', 'Marcos', 'Luis', 'Pedro', 'Diego']
     const lasts = ['Gómez', 'Silva', 'Pérez', 'López', 'Martínez']
     
     const agents = Array.from({length: count}).map(() => ({
       first_name: names[Math.floor(Math.random() * names.length)],
       last_name: lasts[Math.floor(Math.random() * lasts.length)],
       position: positions[Math.floor(Math.random() * positions.length)],
       age: Math.floor(Math.random() * 15) + 18,
       attr_pace: Math.floor(Math.random() * 50) + 30,
       attr_shooting: Math.floor(Math.random() * 50) + 30,
       attr_passing: Math.floor(Math.random() * 50) + 30,
       attr_defending: Math.floor(Math.random() * 50) + 30,
       attr_physical: Math.floor(Math.random() * 50) + 30,
       state_fitness: 100,
       state_morale: 100
     }))
     
     const { error } = await supabase.from('players').insert(agents)
     if (error) console.error("Error generating free agents:", error)
  }
}
