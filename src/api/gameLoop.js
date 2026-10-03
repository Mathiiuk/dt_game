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
  },

  async endSeason(clubId) {
    // 1. Snapshot temporada (MVP simple record)
    await supabase.from('season_history').insert({
      club_id: clubId,
      season_year: new Date().getFullYear(),
      position: 1 // mock
    })

    // 2. Evolución y Envejecimiento
    const { data: players } = await supabase.from('players').select('*').eq('club_id', clubId).eq('is_retired', false)
    
    if (players) {
      for (const p of players) {
        let newAge = p.age + 1
        let isRetired = false
        
        // Retiro
        if (newAge > 35 && Math.random() > 0.5) {
          isRetired = true
        }

        // Evolución atributos
        let pace = p.attr_pace
        let physical = p.attr_physical
        
        if (!isRetired) {
          if (newAge < 24) {
            pace = Math.min(99, pace + 2)
            physical = Math.min(99, physical + 2)
          } else if (newAge > 31) {
            pace = Math.max(10, pace - 3)
            physical = Math.max(10, physical - 2)
          }
        }

        await supabase.from('players').update({
          age: newAge,
          is_retired: isRetired,
          attr_pace: pace,
          attr_physical: physical
        }).eq('id', p.id)
      }
    }

    // 3. Limpiar tabla (MVP truncar standings)
    // Para simplificar, reseteamos todos los puntos de la competición 1
    const { data: standings } = await supabase.from('standings').select('id')
    if (standings) {
      for (const s of standings) {
        await supabase.from('standings').update({
          played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0
        }).eq('id', s.id)
      }
    }

    // 4. Avanzar fecha a la próxima temporada
    const { data: club } = await supabase.from('clubs').select('game_date').eq('id', clubId).single()
    const currentDate = new Date(club.game_date)
    currentDate.setMonth(currentDate.getMonth() + 2)
    
    await supabase.from('clubs').update({ game_date: currentDate.toISOString().split('T')[0] }).eq('id', clubId)
    
    return true
  }
}
