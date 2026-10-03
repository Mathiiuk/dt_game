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
    
    const { data: players } = await supabase.from('players').select('id, state_fitness, injury_days').eq('club_id', clubId)
    
    if (players && players.length > 0) {
      const dayOfWeek = currentDate.getDay()
      const isTrainingDay = dayOfWeek >= 1 && dayOfWeek <= 5
      
      for (const p of players) {
        let newFitness = p.state_fitness
        let newInjuryDays = p.injury_days || 0
        let newInjuryType = null
        
        if (newInjuryDays > 0) {
          newInjuryDays--
          if (newInjuryDays === 0) {
            newInjuryType = null
            newFitness = Math.max(50, newFitness) // recupera un poco al volver
          }
        } else if (isTrainingDay) {
          newFitness = Math.max(0, newFitness - 5)
          
          // Chance de lesionarse en entrenamiento si la fatiga es alta (fitness bajo)
          if (newFitness < 60 && Math.random() < 0.05) {
            newInjuryDays = Math.floor(Math.random() * 14) + 3 // 3 a 16 días
            newInjuryType = 'Muscular'
          }
        }
        
        await supabase.from('players').update({ 
          state_fitness: newFitness,
          injury_days: newInjuryDays,
          ...(newInjuryType !== null ? { injury_type: newInjuryType } : {})
        }).eq('id', p.id)
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
