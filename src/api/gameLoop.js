import { supabase } from './supabase'

export const gameLoopApi = {
  async advanceDay(clubId) {
    // 1. Obtener la fecha actual del club
    const { data: club, error: fetchError } = await supabase
      .from('clubs')
      .select('game_date')
      .eq('id', clubId)
      .single()
      
    if (fetchError) throw new Error(fetchError.message)

    // 2. Sumar 1 día
    const currentDate = new Date(club.game_date)
    currentDate.setDate(currentDate.getDate() + 1)
    const nextDate = currentDate.toISOString().split('T')[0]

    // 3. Simular efectos del entrenamiento de ese día (Phase 08)
    // Reducir un poco el fitness de todos los jugadores simulando entrenamiento
    
    // En un caso real iteraríamos o usaríamos un RPC en postgres para actualizar masivamente
    // Por simplicidad del MVP, haremos una llamada directa: update players set state_fitness = GREATEST(state_fitness - 5, 0)
    // Lamentablemente supabase JS no permite cálculos relativos en updates de forma directa sin RPC, 
    // así que obtendremos la plantilla y actualizaremos.
    
    const { data: players } = await supabase.from('players').select('id, state_fitness').eq('club_id', clubId)
    
    if (players && players.length > 0) {
      // Aplicar fatiga mínima si entrenaron (ej: de lunes a viernes)
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
        const updates = players.map(p => ({
          id: p.id,
          club_id: clubId, // requerido por RLS/Schema en un upsert a veces, pero haremos updates individuales (lento) o nada.
          state_fitness: Math.max(0, p.state_fitness - 5)
        }))
        
        // Upsert massivo para actualizar fitness (requiere todas las keys o manejar en RPC, para el MVP ignoraremos el error de performance)
        for (const u of updates) {
           await supabase.from('players').update({ state_fitness: u.state_fitness }).eq('id', u.id)
        }
      }
    }

    // 4. Guardar nueva fecha
    const { data: updatedClub, error: updateError } = await supabase
      .from('clubs')
      .update({ game_date: nextDate })
      .eq('id', clubId)
      .select()
      .single()

    if (updateError) throw new Error(updateError.message)
    
    return updatedClub.game_date
  }
}
