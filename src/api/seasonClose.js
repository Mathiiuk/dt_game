import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { playerEvolutionApi } from './playerEvolution'
import { competitionApi } from './competition'
import { isCloseIncomplete, needsStage } from '../domain/seasonCloseStages'

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
   * Cierre de temporada en dos partes, retomable.
   *  1) La base cierra la temporada de una vez (`close_season_atomic`): premio, snapshot, contratos y calendario. En la misma
   *     transacción deja la marca de avance (`season_close_progress`, etapa DB_DONE) con el resultado completo.
   *  2) La app termina el resto por etapas, marcando cada una al terminarla: evolución del plantel (EVOLUTION_DONE), liga del año
   *     siguiente (LEAGUE_READY) y partidos + registro de la transición (COMPLETE).
   * Si algo se interrumpe, volver a cerrar (o "Terminar el cierre" en el inicio) retoma desde la última etapa con los MISMOS resultados:
   * no se vuelve a pagar el premio, no se vuelve a envejecer a nadie ni se vuelve a sortear nada.
   */
  async executeSeasonClose({ careerId, clubId, seasonYear }) {
    if (!clubId || !seasonYear) throw new Error('Parámetros requeridos inválidos')
    const startedAt = Date.now()

    // 1. Parte de la base (atómica)
    const { data: dbResult, error: dbErr } = await supabase.rpc('close_season_atomic', {
      p_club_id: clubId,
      p_season_year: seasonYear,
      p_career_id: careerId || null
    })
    if (dbErr) throw new Error(dbErr.message)

    if (dbResult.alreadyClosed) {
      // Ya estaba cerrada: si la segunda parte quedó a medias se completa; si no, no hay nada que hacer
      const progress = await this.getProgress(clubId, seasonYear)
      if (!isCloseIncomplete(progress)) {
        return { alreadyClosed: true, message: `La temporada ${seasonYear} ya fue cerrada y archivada.` }
      }
      return { ...(await this._finish({ progress, clubId, careerId, seasonYear, startedAt })), resumed: true }
    }

    // La base dejó la marca de avance junto con el cierre; si por algo no está, se sigue igual con el resultado en mano
    const saved = await this.getProgress(clubId, seasonYear)
    const progress = saved || { id: null, club_id: clubId, season_year: seasonYear, stage: 'DB_DONE', attempts: 0, payload: { result: dbResult } }
    return this._finish({ progress, clubId, careerId, seasonYear, startedAt })
  },

  /** La marca de avance del cierre de ese año (o null: nunca hubo cierre o es de antes de que existieran las marcas) */
  async getProgress(clubId, seasonYear) {
    const { data, error } = await supabase
      .from('season_close_progress')
      .select('*')
      .eq('club_id', clubId)
      .eq('season_year', seasonYear)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data || null
  },

  /** El cierre que quedó a medias de este club (el más reciente), o null. Nunca falla: si no se puede consultar, no bloquea nada. */
  async getPendingClose(clubId) {
    if (!clubId) return null
    try {
      const { data } = await supabase
        .from('season_close_progress')
        .select('*')
        .eq('club_id', clubId)
        .neq('stage', 'COMPLETE')
        .order('season_year', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data || null
    } catch {
      return null
    }
  },

  /** Retoma el cierre que quedó a medias con los resultados originales. Devuelve el resumen, o `{ alreadyClosed: true }` si no había nada pendiente. */
  async resumeSeasonClose({ clubId, careerId = null }) {
    const progress = await this.getPendingClose(clubId)
    if (!progress) return { alreadyClosed: true, message: 'No hay ningún cierre de temporada pendiente.' }
    return { ...(await this._finish({ progress, clubId, careerId: careerId || progress.career_id, seasonYear: progress.season_year, startedAt: Date.now() })), resumed: true }
  },

  /** Marca una etapa como hecha (y guarda lo que haga falta para retomar). Devuelve la marca actualizada. */
  async _advance(progress, stage, patch = {}) {
    const next = { ...progress, stage, payload: { ...(progress.payload || {}), ...patch } }
    if (!progress.id) return next
    const { error } = await supabase
      .from('season_close_progress')
      .update({ stage, payload: next.payload, last_error: null, updated_at: new Date().toISOString() })
      .eq('id', progress.id)
    if (error) throw new Error(error.message)
    return next
  },

  /** Deja anotado el intento fallido (para poder ver qué pasó); nunca tapa el error original */
  async _recordFailure(progress, err) {
    if (!progress?.id) return
    try {
      await supabase
        .from('season_close_progress')
        .update({ attempts: (progress.attempts || 0) + 1, last_error: String(err?.message || err).slice(0, 500), updated_at: new Date().toISOString() })
        .eq('id', progress.id)
    } catch { /* anotar el intento es lo de menos: el error importante es el original */ }
  },

  /** Corre solo las etapas que faltan, en orden, y arma el resumen para la gala */
  async _finish({ progress, clubId, careerId, seasonYear, startedAt }) {
    const result = progress.payload?.result || {}
    let current = progress
    let evolutionResults = []

    try {
      // 2. Evolución del plantel (los que ya evolucionaron se saltean)
      if (needsStage(current, 'EVOLUTION_DONE')) {
        evolutionResults = await playerEvolutionApi.processAnnualEvolution(clubId, seasonYear)
        const counts = await playerEvolutionApi.countSeasonEvolution(clubId, seasonYear)
        current = await this._advance(current, 'EVOLUTION_DONE', { evolution: counts })
      }

      // 3. Liga de la temporada siguiente (si ya estaba armada se la reconoce)
      if (needsStage(current, 'LEAGUE_READY')) {
        const { standingsJson = [], newTier, oldTier, newSeasonYear } = result
        const mine = standingsJson.find(s => s.club_id === clubId)
        let league = null
        if (mine?.competition_id && standingsJson.length > 1) {
          league = await competitionApi.prepareNextLeague({
            clubId,
            competitionId: mine.competition_id,
            standings: standingsJson,
            oldTier,
            newTier,
            seasonYear: newSeasonYear
          })
        }
        current = await this._advance(current, 'LEAGUE_READY', { league: league ? { competitionId: league.competitionId, clubIds: league.clubIds } : null })
      }

      // 4. Tabla en cero, partidos del año nuevo y registro de la transición
      if (needsStage(current, 'COMPLETE')) {
        const league = current.payload?.league
        if (league) {
          const { error: resetErr } = await supabase
            .from('standings')
            .update({ played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0, form: '' })
            .eq('competition_id', league.competitionId)
          if (resetErr) throw new Error(resetErr.message)
          await competitionApi.generateRoundRobinFixtures(league.competitionId, league.clubIds, `${result.newSeasonYear}-08-01`)
        }

        const evolution = current.payload?.evolution || { aged: 0, retiring: 0 }
        let loggedQuery = supabase.from('season_transition_log').select('id').eq('from_year', seasonYear)
        loggedQuery = careerId ? loggedQuery.eq('career_id', careerId) : loggedQuery.is('career_id', null)
        const { data: logged } = await loggedQuery.limit(1)
        if (!logged || logged.length === 0) {
          const { error: logErr } = await supabase
            .from('season_transition_log')
            .insert({
              career_id: careerId || null,
              from_year: seasonYear,
              to_year: result.newSeasonYear,
              players_aged_count: evolution.aged,
              contracts_expired_count: result.expiredCount,
              players_retired_count: evolution.retiring,
              duration_ms: Date.now() - (startedAt || Date.now())
            })
          if (logErr) throw new Error(logErr.message)
        }
        current = await this._advance(current, 'COMPLETE')
      }
    } catch (err) {
      await this._recordFailure(current, err)
      // La base ya cerró la temporada: lo que falta se retoma con los mismos resultados (la app lo avisa y deja terminarlo)
      err.partialClose = true
      throw err
    }

    // 5. Limpieza masiva de caché
    queryCache.clear()

    return {
      success: true,
      userPosition: result.userPosition,
      championClubId: result.championClubId,
      isPromoted: result.isPromoted,
      isRelegated: result.newTier > result.oldTier,
      totalPrizeAwarded: result.totalPrizeAwarded,
      newBudget: result.newBudget,
      newWageBudget: result.newWageBudget,
      newTier: result.newTier,
      expiredCount: result.expiredCount,
      evolutionResults,
      newSeasonYear: result.newSeasonYear
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
