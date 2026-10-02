import { supabase } from './supabase'

export const competitionApi = {
  async getStandings(clubId) {
    // Para el MVP, simplemente devolveremos una tabla simulada si no hay datos reales completos
    // Buscamos si el club está en standings
    const { data: myStanding, error } = await supabase
      .from('standings')
      .select('*, competitions(*)')
      .eq('club_id', clubId)
      .single()
      
    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    
    if (myStanding) {
       // Buscar todos los standings de esa competición
       const { data: allStandings } = await supabase
         .from('standings')
         .select('*, clubs(name, short_name)')
         .eq('competition_id', myStanding.competition_id)
         .order('points', { ascending: false })
         .order('goals_for', { ascending: false })
         
       return allStandings || []
    }
    
    // Si no está, simulamos la tabla con 10 equipos ficticios + el usuario
    return null
  }
}
