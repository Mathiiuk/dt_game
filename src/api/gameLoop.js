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
      .select('game_date, training_focus, training_intensity')
      .eq('id', clubId)
      .single()
      
    if (fetchError) throw new Error(fetchError.message)

    // 2. Sumar 7 días
    const currentDate = new Date(club.game_date)
    currentDate.setDate(currentDate.getDate() + 7)
    const nextDate = currentDate.toISOString().split('T')[0]

    // 3. Obtener jugadores
    const { data: players } = await supabase.from('players').select('*').eq('club_id', clubId)
    
    if (players && players.length > 0) {
      for (const p of players) {
        let newFitness = p.state_fitness
        let newInjuryDays = p.injury_days || 0
        let newInjuryType = p.injury_type || null
        
        let growth_pace = p.attr_pace
        let growth_passing = p.attr_passing
        let growth_defending = p.attr_defending
        let growth_shooting = p.attr_shooting
        
        // Intensity scale: 0-100. 50 is base.
        const intensityMult = (club.training_intensity || 50) / 50
        const dailyCost = (trainingCost * intensityMult) / 5
        const dailyInjuryProb = injuryProb * intensityMult * (p.injury_risk ? 1.5 : 1)
        
        // Simular la semana día a día
        for (let i = 0; i < 7; i++) {
          if (newInjuryDays > 0) {
            newInjuryDays--
            if (newInjuryDays === 0) {
              newInjuryType = null
              newFitness = Math.max(50, newFitness) // recupera un poco al volver
            }
          } else {
            if (i < 5) {
              newFitness = Math.max(0, newFitness - dailyCost)
              
              // Crecimiento probabilístico por día de entrenamiento basado en el foco
              if (Math.random() < 0.05 * intensityMult) {
                if (club.training_focus === 'FISICO' && growth_pace < p.attr_potential) growth_pace++
                else if (club.training_focus === 'TECNICO' && growth_passing < p.attr_potential) growth_passing++
                else if (club.training_focus === 'TACTICO' && growth_defending < p.attr_potential) growth_defending++
                else if (club.training_focus === 'OFENSIVO' && growth_shooting < p.attr_potential) growth_shooting++
                else if (club.training_focus === 'EQUILIBRADO') {
                  const r = Math.random()
                  if (r < 0.25 && growth_pace < p.attr_potential) growth_pace++
                  else if (r < 0.50 && growth_passing < p.attr_potential) growth_passing++
                  else if (r < 0.75 && growth_defending < p.attr_potential) growth_defending++
                  else if (growth_shooting < p.attr_potential) growth_shooting++
                }
              }

              // Riesgo de lesión
              if (newFitness < injuryThreshold && Math.random() < dailyInjuryProb) {
                newInjuryDays = Math.floor(Math.random() * 21) + 7
                newInjuryType = 'Muscular'
              }
            } else {
              newFitness = Math.min(100, newFitness + 5)
            }
          }
        }
        
        await supabase.from('players').update({ 
          state_fitness: Math.round(newFitness),
          injury_days: newInjuryDays,
          injury_type: newInjuryType,
          attr_pace: growth_pace,
          attr_passing: growth_passing,
          attr_defending: growth_defending,
          attr_shooting: growth_shooting
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

    // 5.5. Simular mercado de fichajes
    const { marketApi } = await import('./market')
    const { contractApi } = await import('./contracts')
    const marketStatus = marketApi.getMarketStatus(nextDate)
    
    // Obtener los jugadores del club del jugador para evaluarlos
    const { data: fullPlayers } = await supabase.from('players').select('*').eq('club_id', clubId)
    await contractApi.generateRandomOffersForWeek(clubId, fullPlayers, marketStatus.isOpen)

    // 5.6. Economia Semanal
    const { economyApi } = await import('./economy')
    await economyApi.processWeeklyFinances(clubId, nextDate, fullPlayers)

    // 6. Evaluacion Dirigencial
    const { data: boardCheck } = await supabase.from('clubs').select('board_confidence').eq('id', clubId).single()
    let isFired = false
    if (boardCheck && boardCheck.board_confidence <= 0) {
      isFired = true
      // Despido!
      await supabase.from('clubs').update({ manager_id: null }).eq('id', clubId)
      await supabase.from('managers').update({ is_looking_for_job: true }).eq('id', managerId)
    }

    // 7. Audit Log
    if (managerId) {
      await auditApi.logAction({
        whoId: managerId,
        action: 'ADVANCE_WEEK',
        entityType: 'club',
        entityId: clubId,
        stateBefore: { date: club.game_date },
        stateAfter: { date: nextDate, fired: isFired }
      })
    }
    
    return { date: updatedClub.game_date, fired: isFired }
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
