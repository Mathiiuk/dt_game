import { supabase } from './supabase'
import { clubHistoryApi } from './clubHistory'
import { managerApi } from './manager'
import { auditApi } from './audit'

/**
 * Servicio de Competiciones Internacionales (Fase 34)
 * Maneja la Copa Gloria Continental (Copa continental principal estilo Libertadores/Champions)
 */
export const internationalCupApi = {
  /**
   * Obtiene el torneo internacional activo y sus fases/partidos
   */
  async getActiveTournament(clubId) {
    if (!clubId) return null

    // 1. Obtener datos del club y fecha actual
    const { data: club } = await supabase.from('clubs').select('*').eq('id', clubId).single()
    const seasonYear = club?.game_date ? new Date(club.game_date).getFullYear() : 2026

    // 2. Buscar torneo existente para la temporada
    let { data: tournament } = await supabase
      .from('international_tournaments')
      .select('*, champion:clubs!international_tournaments_champion_id_fkey(name)')
      .eq('season_year', seasonYear)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3. Si no existe, inicializar torneo continental con 8 clubes
    if (!tournament) {
      tournament = await this.seedTournament(seasonYear, clubId)
    }

    if (!tournament) return null

    // 4. Obtener todos los fixtures del torneo con datos de los clubes
    const { data: fixtures } = await supabase
      .from('international_fixtures')
      .select(`
        *,
        home_club:clubs!international_fixtures_home_club_id_fkey(id, name, short_name, colors),
        away_club:clubs!international_fixtures_away_club_id_fkey(id, name, short_name, colors)
      `)
      .eq('tournament_id', tournament.id)
      .order('match_number', { ascending: true })

    return {
      tournament,
      fixtures: fixtures || [],
      userClubId: clubId
    }
  },

  /**
   * Inicializa la Copa Gloria Continental con 8 clubes
   */
  async seedTournament(seasonYear, userClubId) {
    // 1. Crear el torneo
    const { data: tournament, error } = await supabase
      .from('international_tournaments')
      .insert({
        name: 'Copa Gloria Continental',
        season_year: seasonYear,
        tier: 1,
        status: 'in_progress',
        prize_pool: 1500000
      })
      .select()
      .single()

    if (error || !tournament) {
      console.error('Error seeding international tournament:', error)
      return null
    }

    // 2. Obtener 7 clubes rivales de la base de datos
    const { data: otherClubs } = await supabase
      .from('clubs')
      .select('id, name')
      .neq('id', userClubId)
      .limit(7)

    const participants = [userClubId]
    if (otherClubs) {
      otherClubs.forEach(c => participants.push(c.id))
    }

    // Si faltan clubes para completar 8, duplicar o usar los existentes
    while (participants.length < 8 && participants.length > 0) {
      participants.push(participants[participants.length - 1])
    }

    // 3. Generar los 4 partidos de Cuartos de Final (quarter_finals)
    // El club del usuario juega el Match 1
    const quarterFixtures = [
      {
        tournament_id: tournament.id,
        stage: 'quarter_finals',
        match_number: 1,
        home_club_id: participants[0],
        away_club_id: participants[1] || participants[0],
        match_date: `${seasonYear}-09-16`
      },
      {
        tournament_id: tournament.id,
        stage: 'quarter_finals',
        match_number: 2,
        home_club_id: participants[2] || participants[0],
        away_club_id: participants[3] || participants[0],
        match_date: `${seasonYear}-09-16`
      },
      {
        tournament_id: tournament.id,
        stage: 'quarter_finals',
        match_number: 3,
        home_club_id: participants[4] || participants[0],
        away_club_id: participants[5] || participants[0],
        match_date: `${seasonYear}-09-16`
      },
      {
        tournament_id: tournament.id,
        stage: 'quarter_finals',
        match_number: 4,
        home_club_id: participants[6] || participants[0],
        away_club_id: participants[7] || participants[0],
        match_date: `${seasonYear}-09-16`
      }
    ]

    await supabase.from('international_fixtures').insert(quarterFixtures)

    // Marcar club como participante continental
    await supabase.from('clubs').update({ in_international_cup: true }).eq('id', userClubId)

    return tournament
  },

  /**
   * Simula un partido internacional entre dos clubes IA
   */
  async simulateAiMatch(fixtureId) {
    const homeScore = Math.floor(Math.random() * 4)
    let awayScore = Math.floor(Math.random() * 4)
    if (homeScore === awayScore) {
      // Definición en penales si empatan en eliminación directa
      awayScore = Math.random() > 0.5 ? homeScore + 1 : Math.max(0, homeScore - 1)
    }

    await supabase.from('international_fixtures').update({
      home_score: homeScore,
      away_score: awayScore,
      played: true
    }).eq('id', fixtureId)

    return { homeScore, awayScore }
  },

  /**
   * Procesa el resultado de un partido internacional del usuario
   */
  async processUserMatchResult(fixtureId, userClubId, managerId, homeScore, awayScore) {
    const { data: fixture } = await supabase
      .from('international_fixtures')
      .select('*, tournament:international_tournaments(*)')
      .eq('id', fixtureId)
      .single()

    if (!fixture) throw new Error('Partido internacional no encontrado')

    const isHome = fixture.home_club_id === userClubId
    const userGoals = isHome ? homeScore : awayScore
    const oppGoals = isHome ? awayScore : homeScore
    const userWon = userGoals > oppGoals

    // 1. Guardar resultado
    await supabase.from('international_fixtures').update({
      home_score: homeScore,
      away_score: awayScore,
      played: true
    }).eq('id', fixtureId)

    // 2. Recompensas de Copa Continental
    const { data: club } = await supabase.from('clubs').select('budget, reputation').eq('id', userClubId).single()
    const matchBonus = userWon ? 200000 : 75000 // Gran premio económico por partido de copa
    const xpBonus = userWon ? 80 : 25

    if (club) {
      await supabase.from('clubs').update({
        budget: Number(club.budget || 0) + matchBonus,
        reputation: Math.min(100, (club.reputation || 50) + (userWon ? 2 : 0))
      }).eq('id', userClubId)

      await auditApi.logAction({
        whoId: managerId,
        action: 'INTERNATIONAL_MATCH_REWARD',
        entityType: 'club',
        entityId: userClubId,
        stateBefore: { budget: club.budget },
        stateAfter: { budget: Number(club.budget) + matchBonus, bonus: matchBonus }
      })
    }

    if (managerId) {
      await managerApi.addXp(managerId, xpBonus)
    }

    // 3. Simular los demás partidos de la misma fase que no se hayan jugado aún
    const { data: stageFixtures } = await supabase
      .from('international_fixtures')
      .select('*')
      .eq('tournament_id', fixture.tournament_id)
      .eq('stage', fixture.stage)
      .eq('played', false)

    if (stageFixtures) {
      for (const f of stageFixtures) {
        if (f.id !== fixtureId) {
          await this.simulateAiMatch(f.id)
        }
      }
    }

    // 4. Si era la FINAL y el usuario ganó: Consagración continental
    if (fixture.stage === 'final' && userWon) {
      const champPrize = 1000000
      await supabase.from('clubs').update({
        budget: Number(club.budget || 0) + matchBonus + champPrize
      }).eq('id', userClubId)

      await supabase.from('international_tournaments').update({
        status: 'finished',
        champion_id: userClubId
      }).eq('id', fixture.tournament_id)

      // Registrar hito en la historia del club (Fase 36)
      await clubHistoryApi.addMilestone(userClubId, {
        year: fixture.tournament?.season_year || 2026,
        title: '¡CAMPEÓN DE LA COPA GLORIA CONTINENTAL!',
        description: `Hazaña internacional histórica. El club conquista el continente tras vencer ${homeScore}-${awayScore} en la Gran Final.`,
        category: 'title',
        importance: 5
      })

      // Registrar logro del DT (Fase 38/39)
      await supabase.from('manager_achievements').insert({
        manager_id: managerId,
        club_id: userClubId,
        title: 'Campeón Continental: Copa Gloria',
        year: fixture.tournament?.season_year || 2026,
        type: 'CONTINENTAL_CHAMPION'
      })
    } 
    // 5. Avanzar llave si no era final
    else if (fixture.stage === 'quarter_finals' || fixture.stage === 'semi_finals') {
      await this.advanceBracket(fixture.tournament_id, fixture.stage)
    }

    return { userWon, matchBonus, xpBonus }
  },

  /**
   * Genera los cruces de la siguiente fase (Semifinales o Final)
   */
  async advanceBracket(tournamentId, currentStage) {
    const { data: fixtures } = await supabase
      .from('international_fixtures')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('stage', currentStage)
      .order('match_number', { ascending: true })

    if (!fixtures || fixtures.length === 0) return

    // Obtener los ganadores de cada cruce
    const winners = fixtures.map(f => {
      return (f.home_score || 0) >= (f.away_score || 0) ? f.home_club_id : f.away_club_id
    })

    if (currentStage === 'quarter_finals' && winners.length >= 4) {
      // Crear Semifinales
      const semiFixtures = [
        {
          tournament_id: tournamentId,
          stage: 'semi_finals',
          match_number: 1,
          home_club_id: winners[0],
          away_club_id: winners[1],
          match_date: '2026-10-14'
        },
        {
          tournament_id: tournamentId,
          stage: 'semi_finals',
          match_number: 2,
          home_club_id: winners[2],
          away_club_id: winners[3],
          match_date: '2026-10-14'
        }
      ]
      await supabase.from('international_fixtures').insert(semiFixtures)
    } else if (currentStage === 'semi_finals' && winners.length >= 2) {
      // Crear Gran Final
      const finalFixture = {
        tournament_id: tournamentId,
        stage: 'final',
        match_number: 1,
        home_club_id: winners[0],
        away_club_id: winners[1],
        match_date: '2026-11-20'
      }
      await supabase.from('international_fixtures').insert(finalFixture)
    }
  }
}
