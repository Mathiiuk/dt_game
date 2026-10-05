import { seasonYearOf } from '../domain/gameWeek'
import { supabase } from './supabase'
import { calendarApi } from './calendar'

export const gameLoopApi = {
  /**
   * Avanza la semana en el juego mediante el motor de tiempo autoritativo de calendarApi.
   */
  async advanceWeek(clubId, managerId, options = {}) {
    const { auditApi } = await import('./audit')

    // 1. Resolver career_id si está disponible
    const careerId = options.careerId || (await calendarApi.resolveCareerId(managerId))

    // 2. Ejecutar avance autoritativo con mutex e idempotencia
    const advanceResult = await calendarApi.advanceWeek({
      careerId,
      clubId,
      managerId,
      expectedCurrentWeek: options.expectedCurrentWeek
    })

    // 3. Evaluación dirigencial post-avance
    let isFired = false
    try {
      const { data: boardCheck } = await supabase
        .from('clubs')
        .select('board_confidence')
        .eq('id', clubId)
        .single()

      if (boardCheck && boardCheck.board_confidence <= 0) {
        isFired = true
        await supabase.from('clubs').update({ manager_id: null }).eq('id', clubId)
        await supabase.from('managers').update({ is_looking_for_job: true }).eq('id', managerId)
      }
    } catch (e) {
      console.warn('Error comprobando confianza dirigencial:', e)
    }

    // 4. Audit Log
    if (managerId) {
      try {
        await auditApi.logAction({
          whoId: managerId,
          action: 'ADVANCE_WEEK',
          entityType: 'club',
          entityId: clubId,
          stateBefore: { week: (advanceResult.week || 1) - 1 },
          stateAfter: { week: advanceResult.week, date: advanceResult.date, fired: isFired }
        })
      } catch (e) {
        console.warn('Error registrando auditoría:', e)
      }
    }

    return {
      date: advanceResult.date,
      week: advanceResult.week,
      phase: advanceResult.phase,
      fired: isFired,
      stats: advanceResult.stats
    }
  },

  async endSeason(clubId) {
    // La temporada y la posición salen de los datos del club (antes: reloj real del navegador y siempre el 1.º puesto)
    const { data: clubRow } = await supabase.from('clubs').select('game_date').eq('id', clubId).maybeSingle()
    const seasonYear = clubRow?.game_date ? seasonYearOf(clubRow.game_date) : new Date().getFullYear()
    const { data: mine } = await supabase.from('standings').select('competition_id').eq('club_id', clubId).limit(1).maybeSingle()
    const { data: table } = !mine?.competition_id ? { data: [] } : await supabase
      .from('standings')
      .select('id, club_id')
      .eq('competition_id', mine.competition_id)
      .order('points', { ascending: false })
      .order('goal_difference', { ascending: false })
      .order('goals_for', { ascending: false })
    const position = Math.max(1, (table || []).findIndex(row => row.club_id === clubId) + 1)

    // 1. Snapshot temporada
    try {
      await supabase.from('season_history').insert({ club_id: clubId, season_year: seasonYear, position })
    } catch (e) {
      console.warn('Error guardando historial de temporada:', e)
    }

    // 2. Evolución, Maduración y Declive Natural (Fase 28)
    try {
      const { playerEvolutionApi } = await import('./playerEvolution')
      await playerEvolutionApi.processAnnualEvolution(clubId, seasonYear)
    } catch (evoErr) {
      console.warn('Aviso: error en evolución anual de futbolistas:', evoErr)
    }

    // 3. Reiniciar la tabla de posiciones de ESTA liga (antes se reiniciaban las de todas las ligas)
    const standings = table
    if (standings) {
      // Cada fila es independiente: se reinician todas juntas (antes, una atrás de otra)
      await Promise.all(standings.map(s => supabase.from('standings').update({
        played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0
      }).eq('id', s.id)))
    }

    // 4. Ascensos / Descensos
    const { data: club } = await supabase.from('clubs').select('*').eq('id', clubId).single()
    let newTier = club?.league_tier || 1
    if (newTier > 1) {
      newTier -= 1
    }

    // 5. Avanzar fecha a la próxima temporada (Julio del año siguiente)
    const currentDate = new Date(club?.game_date || '2026-07-01')
    currentDate.setFullYear(currentDate.getFullYear() + 1)
    currentDate.setMonth(6) // Julio
    currentDate.setDate(1)

    const nextSeasonDate = currentDate.toISOString().split('T')[0]

    await supabase.from('clubs').update({
      game_date: nextSeasonDate,
      league_tier: newTier
    }).eq('id', clubId)

    return true
  }
}
