import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { playerEvolutionApi } from './playerEvolution'
import { clubHistoryApi } from './clubHistory'
import { yearsRemaining } from '../domain/contracts'
import { competitionApi } from './competition'

/**
 * Premios federativos escalados a la economía del club de la división 5 (la caja inicial es de unos $20.000 y un año deja ~$45.000).
 * Los liquida la base (`settle_season_prize`); estas constantes fijan la escala que los tests comparan con la función de la base.
 * El bono del goleador se paga si su máximo goleador llega a 8 goles en la temporada.
 */
export const TOP_SCORER_BONUS = 1500
export const TOP_SCORER_MIN_GOALS = 8

export function getPrizeForPosition(pos) {
  if (pos === 1) return 12000
  if (pos === 2) return 8000
  if (pos >= 3 && pos <= 6) return 5000
  if (pos >= 7 && pos <= 17) return 2500
  return 1000
}

export const seasonCloseApi = {
  /**
   * Ejecuta la macro-transición atómica e inmutable de fin de temporada (Reglas 29.1 a 29.4)
   */
  async executeSeasonClose({ careerId, clubId, seasonYear }) {
    if (!clubId || !seasonYear) throw new Error('Parámetros requeridos inválidos')
    const startTime = Date.now()

    // 1. Idempotencia absoluta (Regla 29.1)
    if (careerId) {
      const { data: existingSnapshot } = await supabase
        .from('season_snapshots')
        .select('*')
        .eq('career_id', careerId)
        .eq('season_year', seasonYear)
        .maybeSingle()

      if (existingSnapshot) {
        return {
          alreadyClosed: true,
          snapshot: existingSnapshot,
          message: `La temporada ${seasonYear} ya fue cerrada y archivada con snapshot inmutable.`
        }
      }
    }

    // 2. Obtener la tabla de posiciones definitiva de ESTA liga (antes se leían todas las ligas y el campeón salía de cualquiera)
    const { data: mine } = await supabase.from('standings').select('competition_id').eq('club_id', clubId).limit(1).maybeSingle()
    const { data: standingsRaw, error: standingsErr } = !mine?.competition_id ? { data: [], error: null } : await supabase
      .from('standings')
      .select('*, club:clubs(id, name, short_name)')
      .eq('competition_id', mine.competition_id)
      .order('points', { ascending: false })
      .order('goal_difference', { ascending: false })
      .order('goals_for', { ascending: false })

    // Sin la tabla no se cierra nada: el premio y el calendario nuevo dependen de ella (antes un error de consulta pasaba en silencio)
    if (standingsErr) throw new Error(standingsErr.message)
    const standings = standingsRaw || []

    const championClub = standings[0] || null
    const runnerUpClub = standings[1] || null
    const promotedClubIds = standings.slice(0, 2).map(s => s.club_id).filter(Boolean)
    const relegatedClubIds = standings.slice(-3).map(s => s.club_id).filter(Boolean)

    // 3. Premio de la temporada y goleador del club: los calcula y cobra la base (`settle_season_prize`), antes de reiniciar la tabla
    const { data: prize, error: prizeErr } = await supabase.rpc('settle_season_prize', { p_club_id: clubId, p_season_year: seasonYear, p_career_id: careerId || null })
    if (prizeErr) throw new Error(prizeErr.message)

    // 4. Inmortalizar snapshot inmutable en season_snapshots
    const { data: snapshot, error: snapshotErr } = await supabase
      .from('season_snapshots')
      .insert({
        career_id: careerId || null,
        season_year: seasonYear,
        division_tier: 5,
        champion_club_id: championClub?.club_id || null,
        runner_up_club_id: runnerUpClub?.club_id || null,
        promoted_club_ids: promotedClubIds,
        relegated_club_ids: relegatedClubIds,
        top_scorer_player_id: prize.top_scorer_player_id || null,
        top_scorer_goals: prize.top_scorer_goals || 0,
        best_player_id: prize.top_scorer_player_id || null,
        final_standings_json: standings
      })
      .select()
      .single()

    if (snapshotErr) {
      console.error('Error insertando snapshot de temporada:', snapshotErr)
      throw snapshotErr
    }

    // 5. Premio y presupuesto: ya los liquidó la base (caja, presupuesto salarial y categoría)
    const userClubIndex = standings.findIndex(s => s.club_id === clubId)
    const userPosition = prize.position || (userClubIndex >= 0 ? userClubIndex + 1 : null)
    const totalPrizeAwarded = Number(prize.total || 0)
    const isPromoted = Boolean(prize.promoted) || promotedClubIds.includes(clubId)
    const newBudget = Number(prize.new_budget || 0)
    const newTier = prize.new_tier
    const newWageBudget = Number(prize.new_wage_budget || 0)

    // Registrar hitos y crónica de hemeroteca institucional (Fase 36)
    if (championClub?.club_id === clubId) {
      await clubHistoryApi.addMilestone(clubId, {
        year: seasonYear,
        title: `Campeón de División (Temporada ${seasonYear})`,
        description: `El club se corona campeón absoluto sumando una nueva estrella histórica a sus vitrinas.`,
        category: 'title',
        importance: 5
      })
      await clubHistoryApi.addHemerotecaArticle(clubId, {
        season_year: seasonYear,
        headline: `¡Gloria Eterna! El club se corona campeón indiscutido`,
        snippet: `Una campaña inolvidable que culmina con la vuelta olímpica. La ciudad festeja una conquista histórica que perdurará en la memoria de los hinchas.`,
        media_source: 'El Gráfico del Potrero',
        tag: 'CAMPEON'
      })
    } else if (isPromoted) {
      await clubHistoryApi.addMilestone(clubId, {
        year: seasonYear,
        title: `Ascenso Histórico a División Superior`,
        description: `El club logra el codiciado ascenso a una categoría de mayor jerarquía.`,
        category: 'promotion',
        importance: 4
      })
      await clubHistoryApi.addHemerotecaArticle(clubId, {
        season_year: seasonYear,
        headline: `Hazaña cumplida: ¡Ascenso asegurado!`,
        snippet: `Con garra y corazón, el equipo selló su boleto a la categoría superior desatando el delirio en las tribunas.`,
        media_source: 'Crónica Barrial',
        tag: 'ASCENSO'
      })
    }

    // Registrar balance financiero anual
    const estExpenses = 42000
    const estIncome = totalPrizeAwarded + 55000
    await supabase
      .from('annual_financial_statements')
      .upsert({
        club_id: clubId,
        season_year: seasonYear,
        total_income: estIncome,
        total_expenses: estExpenses,
        net_profit_loss: estIncome - estExpenses,
        prize_money_received: totalPrizeAwarded,
        approved_transfer_budget_next_year: Math.round(newBudget * 0.7),
        approved_wage_budget_next_year: newWageBudget
      }, { onConflict: 'club_id,season_year' })

    // 6. Proceso Biológico de Envejecimiento y Evolución (Fase 28)
    const evolutionResults = await playerEvolutionApi.processAnnualEvolution(clubId, seasonYear)

    // 7. Desvinculación de contratos expirados (Regla 29.2)
    const { data: expiredPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, contract_end')
      .eq('club_id', clubId)
      .lte('contract_end', `${seasonYear + 1}-06-30`)

    let expiredCount = 0
    if (expiredPlayers && expiredPlayers.length > 0) {
      expiredCount = expiredPlayers.length
      for (const ep of expiredPlayers) {
        await supabase
          .from('players')
          .update({
            club_id: null,
            is_transfer_listed: false,
            asking_price: null
          })
          .eq('id', ep.id)
      }
    }

    // 8. Reseteo de Standings para la nueva liga
    if (standings.length > 0) {
      for (const s of standings) {
        await supabase
          .from('standings')
          .update({
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goals_for: 0,
            goals_against: 0,
            goal_difference: 0,
            points: 0
          })
          .eq('id', s.id)
      }
    }

    // 9. Avanzar calendario del juego al nuevo año (Semana 1)
    const nextYear = seasonYear + 1

    // Historial del club (puesto de la temporada) y partidos de la temporada que empieza, en la misma liga
    try {
      await supabase.from('season_history').insert({ club_id: clubId, season_year: seasonYear, position: userPosition })
    } catch (e) {
      console.warn('Aviso: no se pudo guardar el historial de la temporada:', e)
    }
    if (mine?.competition_id && standings.length > 1) {
      await competitionApi.generateRoundRobinFixtures(mine.competition_id, standings.map(s => s.club_id), `${nextYear}-08-01`)
    }
    const nextGameDate = `${nextYear}-07-01`

    // Actualizar fecha en clubs
    await supabase
      .from('clubs')
      .update({ game_date: nextGameDate })
      .eq('id', clubId)

    // Recalcular los años de contrato restantes del plantel que sigue (derivados de contract_end)
    const { data: keptPlayers } = await supabase
      .from('players')
      .select('id, contract_end')
      .eq('club_id', clubId)
    await Promise.all((keptPlayers || []).filter(p => p.contract_end).map(p =>
      supabase.from('players')
        .update({ contract_years: Math.max(1, yearsRemaining(p.contract_end, nextGameDate)) })
        .eq('id', p.id)
    ))

    // Actualizar career_calendar
    if (careerId) {
      await supabase
        .from('career_calendar')
        .update({
          current_season_year: nextYear,
          current_week: 1,
          current_date: nextGameDate,
          transfer_window_open: true,
          season_phase: 'PRE_SEASON'
        })
        .eq('career_id', careerId)
    }

    // 10. Auditoría en season_transition_log
    const durationMs = Date.now() - startTime
    await supabase
      .from('season_transition_log')
      .insert({
        career_id: careerId || null,
        from_year: seasonYear,
        to_year: nextYear,
        players_aged_count: evolutionResults.length,
        contracts_expired_count: expiredCount,
        players_retired_count: evolutionResults.filter(e => e.evolution.retiring).length,
        duration_ms: durationMs
      })

    // 11. Limpieza masiva de caché
    queryCache.clear()

    return {
      success: true,
      snapshot,
      championClub,
      runnerUpClub,
      userPosition,
      isPromoted,
      totalPrizeAwarded,
      newBudget,
      newWageBudget,
      newTier,
      expiredCount,
      evolutionResults,
      newSeasonYear: nextYear
    }
  },

  /**
   * Obtiene los snapshots históricos archivados de temporadas pasadas
   */
  async getSeasonSnapshots(careerId) {
    if (!careerId) return []

    const cached = queryCache.get(`snapshots:${careerId}`)
    if (cached) return cached

    const { data, error } = await supabase
      .from('season_snapshots')
      .select(`
        *,
        champion:champion_club_id (name, short_name),
        runner_up:runner_up_club_id (name, short_name),
        top_scorer:top_scorer_player_id (first_name, last_name)
      `)
      .eq('career_id', careerId)
      .order('season_year', { ascending: false })

    if (error) {
      console.error('Error fetching snapshots:', error)
      return []
    }

    queryCache.set(`snapshots:${careerId}`, data, 60000)
    return data || []
  }
}
