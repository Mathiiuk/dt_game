import { supabase } from './supabase'
import { calendarApi } from './calendar'
import { seasonCloseApi } from './seasonClose'

export const gameLoopApi = {
  /**
   * Avanza la semana en el juego mediante el motor de tiempo autoritativo de calendarApi.
   */
  async advanceWeek(clubId, managerId, options = {}) {
    // Con un cierre de temporada a medias no hay partidos del año nuevo: primero se termina el cierre
    if (await seasonCloseApi.getPendingClose(clubId)) {
      throw new Error('Primero hay que terminar el cierre de la temporada.')
    }

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
        await supabase.from('managers').update({ employment_status: 'UNEMPLOYED', current_contract_wage: 0 }).eq('id', managerId)
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
  }
}
