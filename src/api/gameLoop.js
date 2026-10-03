import { supabase } from './supabase'

export const gameLoopApi = {
  async advanceWeek(clubId, managerId) {
    const { gameConfigApi } = await import('./gameConfig')
    const { auditApi } = await import('./audit')

    const trainingCost = await gameConfigApi.getNumber('training_fitness_cost', 10)
    const injuryProb = await gameConfigApi.getNumber('injury_base_prob', 0.05)
    const injuryThreshold = await gameConfigApi.getNumber('injury_fitness_threshold', 60)

    // 1. Obtener la fecha actual del club
    const { data: club, error: fetchError } = await supabase
      .from('clubs')
      .select('game_date')
      .eq('id', clubId)
      .single()
      
    if (fetchError) throw new Error(fetchError.message)

    // 2. Sumar 7 días
    const currentDate = new Date(club.game_date)
    currentDate.setDate(currentDate.getDate() + 7)
    const nextDate = currentDate.toISOString().split('T')[0]

    // 3. Obtener jugadores
    const { data: players } = await supabase.from('players').select('id, state_fitness, injury_days').eq('club_id', clubId)
    
    if (players && players.length > 0) {
      for (const p of players) {
        let newFitness = p.state_fitness
        let newInjuryDays = p.injury_days || 0
        let newInjuryType = null
        
        // Simular la semana día a día
        for (let i = 0; i < 7; i++) {
          if (newInjuryDays > 0) {
            newInjuryDays--
            if (newInjuryDays === 0) {
              newInjuryType = null
              newFitness = Math.max(50, newFitness) // recupera un poco al volver
            }
          } else {
            // Suponemos 5 días de entrenamiento y 2 de descanso en la semana de forma genérica
            if (i < 5) {
              // Costo de entrenamiento por día (costo semanal / 5)
              newFitness = Math.max(0, newFitness - (trainingCost / 5))
              
              // Riesgo de lesión
              if (newFitness < injuryThreshold && Math.random() < injuryProb) {
                newInjuryDays = Math.floor(Math.random() * 14) + 3
                newInjuryType = 'Muscular'
              }
            } else {
              // Día de descanso (podría ser parametrizable)
              newFitness = Math.min(100, newFitness + 5)
            }
          }
        }
        
        await supabase.from('players').update({ 
          state_fitness: Math.round(newFitness),
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
      
    // 5. Simular partidos de torneo
    const { competitionApi } = await import('./competition')
    await competitionApi.simulateMatchDay(nextDate)

    // 6. Audit Log
    if (managerId) {
      await auditApi.logAction({
        whoId: managerId,
        action: 'ADVANCE_WEEK',
        entityType: 'club',
        entityId: clubId,
        stateBefore: { date: club.game_date },
        stateAfter: { date: nextDate }
      })
    }
    
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

    // 4. Ascensos / Descensos (MVP: Si ganaste la liga y estás en tier 2, subes a 1)
    const { data: club } = await supabase.from('clubs').select('*').eq('id', clubId).single()
    let newTier = club.league_tier || 1
    // Asumimos position=1 sube.
    if (newTier > 1) {
      newTier -= 1 
    }
    
    // 5. Avanzar fecha a la próxima temporada
    const currentDate = new Date(club.game_date)
    currentDate.setMonth(currentDate.getMonth() + 2)
    
    await supabase.from('clubs').update({ 
      game_date: currentDate.toISOString().split('T')[0],
      league_tier: newTier
    }).eq('id', clubId)
    
    return true
  }
}
