import { supabase } from './supabase'
import { clubApi } from './club'

export const marketApi = {
  async getMarketPlayers(currentClubId, filters = {}) {
    let query = supabase
      .from('players')
      .select('*, clubs(name, short_name)')
      .neq('club_id', currentClubId)
      
    if (filters.position) query = query.eq('position', filters.position)
    if (filters.minPace) query = query.gte('attr_pace', filters.minPace)
    query = query.limit(50)

    const { data: players, error } = await query
    if (error) throw new Error(error.message)
    
    // Obtener reportes de scout para este club
    const { data: reports } = await supabase
      .from('scout_reports')
      .select('player_id, level')
      .eq('club_id', currentClubId)
      
    const reportMap = {}
    if (reports) reports.forEach(r => reportMap[r.player_id] = r.level)
    
    return players.map(p => ({
      ...p,
      scout_level: reportMap[p.id] || 0
    }))
  },

  async scoutPlayer(clubId, playerId) {
    const { error } = await supabase
      .from('scout_reports')
      .upsert({ club_id: clubId, player_id: playerId, level: 1 }, { onConflict: 'club_id,player_id' })
      
    if (error) throw new Error(error.message)
    return true
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
