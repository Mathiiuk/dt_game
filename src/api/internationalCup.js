import { supabase } from './supabase'
import { cupSchedule, cupSeasonYear, qualifiedClubIds, quarterPairs, planTournamentStep, dueUserFixture, isDue, matchDateOf } from '../domain/cupTournament'
import { clubHistoryApi } from './clubHistory'
import { managerApi } from './manager'
import { auditApi } from './audit'

export const INTERNATIONAL_CUPS_CONFIG = {
  group_stage_qualification_prize: 300000,
  group_stage_win_bonus: 50000,
  round_of_16_prize: 400000,
  quarter_finals_prize: 600000,
  semi_finals_prize: 900000,
  runner_up_prize: 1200000,
  champion_prize: 2000000,
  continental_title_reputation_boost: 25.0,
  travel_fatigue_penalty: -10
}

/**
 * Servicio de Competiciones Internacionales (Fase 34)
 * Maneja la Copa Gloria Continental (Copa continental principal estilo Libertadores)
 */
export const internationalCupApi = {
  /** Tabla de la liga del club dado (incluido él) */
  async getLeagueStandings(clubId) {
    const { data: mine } = await supabase.from('standings').select('competition_id').eq('club_id', clubId).limit(1).maybeSingle()
    if (!mine?.competition_id) return []
    const { data } = await supabase.from('standings').select('club_id, points, goals_for, goals_against').eq('competition_id', mine.competition_id)
    return data || []
  },

  /** Torneo de la temporada de ESTA liga: el que tiene partidos de algún club de la liga del usuario */
  async findTournament(clubId, seasonYear) {
    const standings = await this.getLeagueStandings(clubId)
    const ids = standings.map(s => s.club_id)
    if (ids.length === 0) return null
    const { data: row } = await supabase
      .from('international_fixtures')
      .select('tournament_id, international_tournaments!inner(season_year)')
      .in('home_club_id', ids)
      .eq('international_tournaments.season_year', seasonYear)
      .limit(1)
      .maybeSingle()
    if (!row?.tournament_id) return null
    return this.refreshTournament(row.tournament_id)
  },

  async refreshTournament(id) {
    const { data } = await supabase.from('international_tournaments').select('*, champion:clubs(name)').eq('id', id).maybeSingle()
    return data
  },

  async loadFixtures(tournamentId) {
    const { data } = await supabase
      .from('international_fixtures')
      .select(`
        *,
        home_club:clubs!international_fixtures_home_club_id_fkey(id, name, short_name, colors),
        away_club:clubs!international_fixtures_away_club_id_fkey(id, name, short_name, colors)
      `)
      .eq('tournament_id', tournamentId)
      .order('match_date', { ascending: true })
      .order('match_number', { ascending: true })
    return data || []
  },

  /**
   * Estado de la copa para el club:
   * - antes del sorteo (1 de septiembre) no hay torneo: se informa cuándo arranca;
   * - el sorteo toma a los 8 mejores de la liga del usuario (puede no clasificar y mirar la copa de lejos);
   * - cada partido tiene su fecha: los de IA se juegan solos al llegar y el del usuario espera a que lo dispute.
   */
  async getActiveTournament(clubId) {
    if (!clubId) return null

    const { data: club } = await supabase.from('clubs').select('game_date').eq('id', clubId).maybeSingle()
    const gameDate = club?.game_date || '2026-07-01'
    const seasonYear = cupSeasonYear(gameDate)
    const schedule = cupSchedule(seasonYear)

    let tournament = await this.findTournament(clubId, seasonYear)

    if (!tournament) {
      if (String(gameDate).slice(0, 10) < schedule.seedDate) {
        return { tournament: null, fixtures: [], userClubId: clubId, schedule, gameDate, qualified: false, notStarted: true }
      }
      tournament = await this.seedTournament(seasonYear, clubId, schedule)
    }
    if (!tournament) return null

    const fixtures = await this.syncTournament(tournament, gameDate, clubId, schedule)
    const qualified = fixtures.some(f => f.home_club_id === clubId || f.away_club_id === clubId)

    return { tournament: (await this.refreshTournament(tournament.id)) || tournament, fixtures, userClubId: clubId, schedule, gameDate, qualified, notStarted: false }
  },

  /** Sorteo: los 8 mejores de la liga, cuartos en su fecha */
  async seedTournament(seasonYear, userClubId, schedule = cupSchedule(seasonYear)) {
    const standings = await this.getLeagueStandings(userClubId)
    const qualified = qualifiedClubIds(standings)
    if (qualified.length < 8) return null

    const { data: tournament, error } = await supabase
      .from('international_tournaments')
      .insert({
        name: 'Copa Gloria Continental',
        tournament_type: 'CONTINENTAL_CHAMPIONS_CUP',
        season_year: seasonYear,
        tier: 1,
        status: 'in_progress',
        current_stage: 'quarter_finals',
        prize_pool: INTERNATIONAL_CUPS_CONFIG.champion_prize
      })
      .select()
      .single()

    if (error || !tournament) {
      console.error('Error seeding international tournament:', error)
      return null
    }

    // Cuartos de ida y vuelta: en la vuelta se invierte la localía
    const quarterFixtures = quarterPairs(qualified).flatMap(([home, away], i) => [1, 2].map(leg => ({
      tournament_id: tournament.id,
      stage: 'quarter_finals',
      match_number: i + 1,
      leg,
      home_club_id: leg === 1 ? home : away,
      away_club_id: leg === 1 ? away : home,
      match_date: matchDateOf(schedule, 'quarter_finals', leg)
    })))
    await supabase.from('international_fixtures').insert(quarterFixtures)

    if (qualified.includes(userClubId)) {
      await supabase.from('clubs').update({ in_international_cup: true }).eq('id', userClubId)
    }
    return tournament
  },

  /**
   * Hace avanzar el torneo hasta la fecha de juego: simula los partidos de IA vencidos, crea las fases siguientes
   * y cierra el torneo cuando se jugó la final. Es idempotente: se puede llamar las veces que haga falta.
   */
  async syncTournament(tournament, gameDate, userClubId, schedule) {
    let fixtures = await this.loadFixtures(tournament.id)

    for (let guard = 0; guard < 8; guard++) {
      const plan = planTournamentStep({ fixtures, gameDate, userClubId, schedule })
      if (plan.toSimulate.length === 0 && plan.toCreate.length === 0) {
        if (plan.championId && tournament.status !== 'finished') {
          await supabase.from('international_tournaments').update({ status: 'finished', champion_id: plan.championId }).eq('id', tournament.id)
        }
        break
      }

      if (plan.toSimulate.length > 0) await this.simulateAiMatches(plan.toSimulate, userClubId)
      if (plan.toCreate.length > 0) {
        await supabase.from('international_fixtures').insert(plan.toCreate.map(f => ({ ...f, tournament_id: tournament.id })))
      }
      fixtures = await this.loadFixtures(tournament.id)
    }
    return fixtures
  },

  /**
   * Resultados de los partidos entre clubes de IA: los decide la base (función `play_cup_ai_fixtures`) según la fuerza de cada
   * plantel, deterministas por partido. El navegador ya no escribe resultados: un disparador lo impide.
   */
  async simulateAiMatches(list, userClubId) {
    const ids = list.map(f => f.id).filter(Boolean)
    if (ids.length === 0) return 0
    const { data, error } = await supabase.rpc('play_cup_ai_fixtures', { p_user_club_id: userClubId, p_fixture_ids: ids })
    if (error) throw new Error(error.message)
    return data || 0
  },

  /** ¿Hay un partido propio de copa que ya llegó a su fecha y no se jugó? (frena el avance de semana) */
  async hasDueUserMatch(clubId, gameDate) {
    if (!clubId) return false
    // Una sola consulta: partidos propios de la copa de esta temporada sin jugar que ya llegaron a su fecha
    // (antes: tabla de la liga, búsqueda del torneo, refresco y carga de todos los partidos, una detrás de otra)
    const { data } = await supabase
      .from('international_fixtures')
      .select('id, match_date, played, international_tournaments!inner(season_year)')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .eq('played', false)
      .eq('international_tournaments.season_year', cupSeasonYear(gameDate))
      .lte('match_date', String(gameDate).slice(0, 10))
      .limit(1)
    return Boolean(data && data.length > 0)
  },

  /**
   * Disputa el partido del usuario. El resultado lo decide la base (función `play_cup_fixture`): valida que el partido sea
   * del club, que no se haya jugado y que ya llegó su fecha, y no se puede volver a tirar. Después se liquidan premios y efectos.
   */
  async playUserMatch(fixtureId, userClubId, managerId) {
    const { data, error } = await supabase.rpc('play_cup_fixture', { p_fixture_id: fixtureId, p_user_club_id: userClubId })
    if (error) throw new Error(error.message)

    const homeScore = data.home_score
    const awayScore = data.away_score
    const result = await this.processUserMatchResult(fixtureId, userClubId, managerId, homeScore, awayScore)
    return { ...result, homeScore, awayScore }
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
    // El resultado ya lo guardó la base (y no deja jugar dos veces el mismo partido): acá solo se liquida lo que sigue

    const isHome = fixture.home_club_id === userClubId
    const userGoals = isHome ? homeScore : awayScore
    const oppGoals = isHome ? awayScore : homeScore
    const userWon = userGoals > oppGoals

    // 2. Recompensas de Copa Continental
    const { data: club } = await supabase.from('clubs').select('budget, reputation').eq('id', userClubId).single()
    const matchBonus = userWon ? 200000 : 75000 // Gran premio económico por partido de copa
    const xpBonus = userWon ? 100 : 35

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

      // Reputación de DT (Fase 32)
      if (userWon) {
        try {
          const { reputationApi } = await import('./reputation')
          await reputationApi.applyReputationDelta({
            managerId,
            eventType: 'INTERNATIONAL_TRIUMPH',
            sourceEntityId: fixtureId,
            delta: 2.0,
            description: `Victoria internacional en ${fixture.stage}`
          })
        } catch (repErr) {
          console.warn('Aviso: no se pudo actualizar reputación por partido continental:', repErr)
        }
      }
    }

    // Regla 34.4: Desgaste físico por viaje transcontinental (-10 fitness)
    try {
      const { data: squad } = await supabase
        .from('players')
        .select('id, state_fitness')
        .eq('club_id', userClubId)
        .limit(14)

      if (squad) {
        for (const p of squad) {
          const newFit = Math.max(30, (p.state_fitness || 85) + INTERNATIONAL_CUPS_CONFIG.travel_fatigue_penalty)
          await supabase.from('players').update({ state_fitness: newFit }).eq('id', p.id)
        }
      }
    } catch (e) {
      console.warn('Aviso fatiga continental:', e)
    }

    // 4. Si era la FINAL y el usuario ganó: Consagración continental suprema
    if (fixture.stage === 'final' && userWon) {
      const champPrize = INTERNATIONAL_CUPS_CONFIG.champion_prize // $2,000,000
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

      // Registrar logro del DT en vitrina de carrera (Fase 31 / 38 / 39)
      try {
        const { careerApi } = await import('./career')
        await careerApi.recordTrophyInStint(managerId, userClubId, 'Copa Gloria Continental')

        const { reputationApi } = await import('./reputation')
        await reputationApi.applyReputationDelta({
          managerId,
          eventType: 'TITLE_WON',
          sourceEntityId: `champ_${fixture.tournament_id}`,
          delta: INTERNATIONAL_CUPS_CONFIG.continental_title_reputation_boost, // +25 pts
          description: '¡Campeón de la Copa Gloria Continental!'
        })
      } catch (e) {
        console.warn('Aviso trofeo de DT:', e)
      }

      await supabase.from('manager_achievements').insert({
        manager_id: managerId,
        club_id: userClubId,
        title: 'Campeón Continental: Copa Gloria',
        year: fixture.tournament?.season_year || 2026,
        type: 'CONTINENTAL_CHAMPION'
      })
    }

    // 5. Resolver lo que dependa de este resultado (la siguiente fase, los partidos de IA de la misma fecha)
    try {
      const { data: t } = await supabase.from('international_tournaments').select('*').eq('id', fixture.tournament_id).maybeSingle()
      const { data: gd } = await supabase.from('clubs').select('game_date').eq('id', userClubId).maybeSingle()
      if (t) await this.syncTournament(t, gd?.game_date || '2026-07-01', userClubId, cupSchedule(t.season_year))
    } catch (syncErr) {
      console.warn('Aviso: no se pudo avanzar la copa tras el partido:', syncErr)
    }

    return { userWon, matchBonus, xpBonus }
  }
}
