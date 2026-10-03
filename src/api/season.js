import { supabase } from './supabase'
import { competitionApi } from './competition'
import { auditApi } from './audit'

export const seasonApi = {
  // Check if current season matches are all played
  async isSeasonComplete(clubId) {
    // Check if there are any pending fixtures for the club's competition
    const { data: myStanding } = await supabase
      .from('standings')
      .select('competition_id')
      .eq('club_id', clubId)
      .single()

    if (!myStanding) return false

    const { count, error } = await supabase
      .from('fixtures')
      .select('*', { count: 'exact', head: true })
      .eq('competition_id', myStanding.competition_id)
      .eq('status', 'PENDING')

    if (error) return false
    return count === 0
  },

  // Atomic Season Close Process
  async closeSeason(clubId, managerId) {
    // 1. Obtener standing actual y ranking
    const standings = await competitionApi.getStandings(clubId)
    if (!standings || standings.length === 0) throw new Error('No hay tabla de posiciones activa')

    const myStandingIndex = standings.findIndex(s => s.club_id === clubId)
    const position = myStandingIndex !== -1 ? myStandingIndex + 1 : 10
    const myStats = standings[myStandingIndex] || {}

    const isChampion = position === 1
    const { data: club } = await supabase.from('clubs').select('*').eq('id', clubId).single()
    const currentTier = club?.league_tier || 4
    
    // Promocion si termina top 2 y no esta en tier 1
    const isPromoted = position <= 2 && currentTier > 1
    // Descenso si termina en últimos 2 y no está en el tier más bajo
    const isRelegated = position >= 19 && currentTier < 4

    let newTier = currentTier
    if (isPromoted) newTier = currentTier - 1
    if (isRelegated) newTier = currentTier + 1

    // 2. Premios económicos según posición
    let prizeMoney = 40000
    if (position === 1) prizeMoney = 250000
    else if (position === 2) prizeMoney = 150000
    else if (position <= 5) prizeMoney = 90000
    else if (position <= 10) prizeMoney = 60000

    const currentYear = new Date(club.game_date).getFullYear()

    // 3. Guardar en season_history
    await supabase.from('season_history').insert({
      club_id: clubId,
      manager_id: managerId,
      season_year: currentYear,
      competition_name: myStats.competitions?.name || `Liga Tier ${currentTier}`,
      position,
      points: myStats.points || 0,
      won: myStats.won || 0,
      drawn: myStats.drawn || 0,
      lost: myStats.lost || 0,
      goals_for: myStats.goals_for || 0,
      goals_against: myStats.goals_against || 0,
      champion: isChampion,
      promoted: isPromoted,
      relegated: isRelegated,
      prize_money: prizeMoney
    })

    // 4. Registrar logros del DT
    if (isChampion) {
      await supabase.from('manager_achievements').insert({
        manager_id: managerId,
        club_id: clubId,
        title: `Campeón: ${myStats.competitions?.name || 'Liga'}`,
        year: currentYear,
        type: 'CHAMPION'
      })
    } else if (isPromoted) {
      await supabase.from('manager_achievements').insert({
        manager_id: managerId,
        club_id: clubId,
        title: `Ascenso a Tier ${newTier}`,
        year: currentYear,
        type: 'PROMOTION'
      })
    }

    // 5. Envejecimiento y evolución de jugadores
    const { data: players } = await supabase.from('players').select('*').eq('club_id', clubId).eq('is_retired', false)
    const retiredPlayers = []

    if (players && players.length > 0) {
      for (const p of players) {
        const newAge = p.age + 1
        let isRetired = false

        if (newAge >= 35 && Math.random() > 0.4) {
          isRetired = true
          retiredPlayers.push(`${p.first_name} ${p.last_name}`)
        }

        let pace = p.attr_pace
        let passing = p.attr_passing
        let defending = p.attr_defending
        let shooting = p.attr_shooting

        if (!isRetired) {
          // Jóvenes crecen más rápido hacia su potencial
          if (newAge <= 23) {
            const growth = Math.floor(Math.random() * 3) + 1
            if (p.attr_potential > pace) pace = Math.min(p.attr_potential, pace + growth)
            if (p.attr_potential > passing) passing = Math.min(p.attr_potential, passing + growth)
            if (p.attr_potential > defending) defending = Math.min(p.attr_potential, defending + growth)
            if (p.attr_potential > shooting) shooting = Math.min(p.attr_potential, shooting + growth)
          } else if (newAge >= 32) {
            // Veteranos declinan físicamente
            pace = Math.max(20, pace - (Math.floor(Math.random() * 3) + 1))
          }
        }

        await supabase.from('players').update({
          age: newAge,
          is_retired: isRetired,
          attr_pace: pace,
          attr_passing: passing,
          attr_defending: defending,
          attr_shooting: shooting,
          state_fitness: 100 // Restauración para inicio de pretemporada
        }).eq('id', p.id)
      }
    }

    // 6. Reset de Standings de la competición
    const { data: competitionStandings } = await supabase
      .from('standings')
      .select('id')
      .eq('competition_id', myStats.competition_id)

    if (competitionStandings) {
      for (const s of competitionStandings) {
        await supabase.from('standings').update({
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0
        }).eq('id', s.id)
      }
    }

    // 7. Borrar fixtures viejos jugados y regenerar nueva temporada
    await supabase.from('fixtures').delete().eq('competition_id', myStats.competition_id)
    
    // Nueva fecha de inicio: 1 de Agosto del próximo año
    const nextSeasonStartDate = new Date(`${currentYear + 1}-08-01`)
    const nextSeasonDateStr = nextSeasonStartDate.toISOString().split('T')[0]

    // Obtener todos los clubes de la competición para regenerar el fixture
    const allClubIds = standings.map(s => s.club_id)
    const n = allClubIds.length
    const rounds = n - 1
    const halfSize = n / 2
    const teams = [...allClubIds]
    const newFixtures = []

    for (let round = 0; round < rounds; round++) {
      const matchDate = new Date(nextSeasonStartDate)
      matchDate.setDate(nextSeasonStartDate.getDate() + (round * 7))

      for (let i = 0; i < halfSize; i++) {
        let home = teams[i]
        let away = teams[n - 1 - i]
        if (i === 0 && round % 2 === 1) {
          const temp = home
          home = away
          away = temp
        }

        newFixtures.push({
          competition_id: myStats.competition_id,
          match_week: round + 1,
          home_team_id: home,
          away_team_id: away,
          match_date: matchDate.toISOString(),
          status: 'PENDING'
        })

        // Vuelta
        const returnDate = new Date(matchDate)
        returnDate.setDate(returnDate.getDate() + (rounds * 7))
        newFixtures.push({
          competition_id: myStats.competition_id,
          match_week: round + 1 + rounds,
          home_team_id: away,
          away_team_id: home,
          match_date: returnDate.toISOString(),
          status: 'PENDING'
        })
      }
      teams.splice(1, 0, teams.pop())
    }

    await supabase.from('fixtures').insert(newFixtures)

    // 8. Actualizar Club: presupuesto, tier, fecha y confianza
    const newBudget = (club.budget || 0) + prizeMoney
    const newBoardConfidence = isChampion || isPromoted ? 95 : isRelegated ? 40 : 75
    const newFansConfidence = isChampion ? 98 : isPromoted ? 90 : isRelegated ? 35 : 75

    await supabase.from('clubs').update({
      budget: newBudget,
      league_tier: newTier,
      game_date: nextSeasonDateStr,
      board_confidence: newBoardConfidence,
      fans_confidence: newFansConfidence,
      squad_morale: 80 // Renovación de esperanzas para pretemporada
    }).eq('id', clubId)

    // 9. Registrar auditoría
    await auditApi.logAction({
      whoId: managerId,
      action: 'CLOSE_SEASON',
      entityType: 'club',
      entityId: clubId,
      stateBefore: { year: currentYear, tier: currentTier, position },
      stateAfter: { year: currentYear + 1, tier: newTier, prizeMoney, retiredCount: retiredPlayers.length }
    })

    return {
      position,
      champion: isChampion,
      promoted: isPromoted,
      relegated: isRelegated,
      prizeMoney,
      retiredPlayers,
      newTier,
      nextYear: currentYear + 1
    }
  },

  // Obtener historial de temporadas jugadas por el club
  async getSeasonHistory(clubId) {
    const { data, error } = await supabase
      .from('season_history')
      .select('*')
      .eq('club_id', clubId)
      .order('season_year', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  // Obtener logros y trofeos del DT
  async getManagerAchievements(managerId) {
    const { data, error } = await supabase
      .from('manager_achievements')
      .select('*, clubs(name)')
      .eq('manager_id', managerId)
      .order('year', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }
}
