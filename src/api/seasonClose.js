import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { playerEvolutionApi } from './playerEvolution'
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

    // 1. Ejecutar el macro-cierre atómico en el servidor (Finanzas, Contratos, Snapshot, Hemeroteca, Calendario)
    const { data: dbResult, error: dbErr } = await supabase.rpc('close_season_atomic', {
      p_club_id: clubId,
      p_season_year: seasonYear,
      p_career_id: careerId || null
    })

    if (dbErr) throw new Error(dbErr.message)
    
    if (dbResult.alreadyClosed) {
      return {
        alreadyClosed: true,
        message: `La temporada ${seasonYear} ya fue cerrada y archivada.`
      }
    }

    // 2. Proceso Biológico de Envejecimiento y Evolución (Fase 28)
    // Se ejecuta en JS porque usa heurísticas complejas de potencial y edad.
    const evolutionResults = await playerEvolutionApi.processAnnualEvolution(clubId, seasonYear)

    // 3. Liga de la temporada siguiente y generación del nuevo Fixture de 38 fechas (o 19 si venía así)
    let nextLeague = null
    const { standingsJson, newTier, oldTier, newSeasonYear } = dbResult
    const mine = standingsJson.find(s => s.club_id === clubId)

    if (mine?.competition_id && standingsJson.length > 1) {
      nextLeague = await competitionApi.prepareNextLeague({
        clubId,
        competitionId: mine.competition_id,
        standings: standingsJson,
        oldTier: oldTier,
        newTier: newTier,
        seasonYear: newSeasonYear
      })
      await supabase
        .from('standings')
        .update({ played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0, form: '' })
        .eq('competition_id', nextLeague.competitionId)
    }

    if (nextLeague) {
      await competitionApi.generateRoundRobinFixtures(nextLeague.competitionId, nextLeague.clubIds, `${newSeasonYear}-08-01`)
    }

    // 4. Auditoría en season_transition_log
    const durationMs = Date.now() - startTime
    await supabase
      .from('season_transition_log')
      .insert({
        career_id: careerId || null,
        from_year: seasonYear,
        to_year: newSeasonYear,
        players_aged_count: evolutionResults.length,
        contracts_expired_count: dbResult.expiredCount,
        players_retired_count: evolutionResults.filter(e => e.evolution.retiring).length,
        duration_ms: durationMs
      })

    // 5. Limpieza masiva de caché
    queryCache.clear()

    return {
      success: true,
      userPosition: dbResult.userPosition,
      isPromoted: dbResult.isPromoted,
      isRelegated: dbResult.newTier > dbResult.oldTier,
      totalPrizeAwarded: dbResult.totalPrizeAwarded,
      newBudget: dbResult.newBudget,
      newWageBudget: dbResult.newWageBudget,
      newTier: dbResult.newTier,
      expiredCount: dbResult.expiredCount,
      evolutionResults,
      newSeasonYear: dbResult.newSeasonYear
    }
  },

  /**
   * Jugadores del club cuyo contrato vence con esta temporada (quedan libres al cerrarla), los de mayor nivel primero.
   * La gala los muestra antes de cerrar para que el DT renueve.
   */
  async getExpiringContracts(clubId, seasonYear) {
    if (!clubId || !seasonYear) return []
    const { data } = await supabase
      .from('players')
      .select('id, first_name, last_name, contract_end, overall')
      .eq('club_id', clubId)
      .lte('contract_end', `${seasonYear + 1}-06-30`)
    return [...(data || [])].sort((a, b) => (b.overall || 0) - (a.overall || 0))
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
