import { supabase } from './supabase'
import { calendarApi } from './calendar'

export const gameLoopApi = {
  /**
   * Avanza la semana en el juego mediante el motor de tiempo autoritativo de calendarApi.
   */
  async advanceWeek(clubId, managerId, options = {}) {
    const { auditApi } = await import('./audit')

    // 1. Resolver career_id si está disponible
    let careerId = options.careerId || null
    if (!careerId && managerId) {
      try {
        const { data: manager } = await supabase
          .from('managers')
          .select('user_id')
          .eq('id', managerId)
          .single()

        if (manager?.user_id) {
          const { data: session } = await supabase
            .from('user_sessions')
            .select('active_career_id')
            .eq('user_id', manager.user_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (session?.active_career_id) {
            careerId = session.active_career_id
          }
        }
      } catch (e) {
        // Fallback sin career_id específico
      }
    }

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
    // 1. Snapshot temporada
    try {
      await supabase.from('season_history').insert({
        club_id: clubId,
        season_year: new Date().getFullYear(),
        position: 1
      })
    } catch (e) {
      console.warn('Error guardando historial de temporada:', e)
    }

    // 2. Evolución, Maduración y Declive Natural (Fase 28)
    try {
      const { playerEvolutionApi } = await import('./playerEvolution')
      const seasonYear = new Date().getFullYear()
      await playerEvolutionApi.processAnnualEvolution(clubId, seasonYear)
    } catch (evoErr) {
      console.warn('Aviso: error en evolución anual de futbolistas:', evoErr)
    }

    // 3. Reiniciar tabla de posiciones
    const { data: standings } = await supabase.from('standings').select('id')
    if (standings) {
      for (const s of standings) {
        await supabase.from('standings').update({
          played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0
        }).eq('id', s.id)
      }
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
