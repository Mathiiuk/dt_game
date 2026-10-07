import { evaluateBoardAfterMatch } from '../domain/boardConfidence'
import { supabase } from './supabase'
import { ensureRow } from '../utils/ensureRow'
import { queryCache } from '../utils/cache'
import { financesApi } from './finances'

export const BOARD_STATUSES = {
  FULL_CONFIDENCE: {
    key: 'FULL_CONFIDENCE',
    minScore: 80,
    title: 'Plena Confianza Dirigencial',
    badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    description: 'La Comisión Directiva respalda absolutamente tu proyecto deportivo y respeta tus decisiones.'
  },
  STABLE: {
    key: 'STABLE',
    minScore: 55,
    title: 'Confianza Estable',
    badgeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
    description: 'Relación profesional sólida. Se cumplen los objetivos mínimos de temporada sin turbulencias.'
  },
  UNDER_WATCH: {
    key: 'UNDER_WATCH',
    minScore: 40,
    title: 'En Observación Rigurosa',
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    description: 'Inquietud dirigencial. La directiva exige una mejora inmediata en los resultados para no abrir expediente.'
  },
  CRITICAL_ULTIMATUM: {
    key: 'CRITICAL_ULTIMATUM',
    minScore: 20,
    title: 'Ultimátum Crítico de Despido',
    badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
    description: 'Plazo fijado. Debes sumar los puntos exigidos en los partidos señalados o serás cesado de inmediato.'
  },
  DISMISSAL_IMMINENT: {
    key: 'DISMISSAL_IMMINENT',
    minScore: 0,
    title: 'Destitución Inminente',
    badgeColor: 'text-red-500 bg-red-950/50 border-red-800/80',
    description: 'Paciencia agotada. Proceso de desvinculación formal activado.'
  }
}

export const boardApi = {
  /**
   * Obtiene o inicializa el estado de confianza de la comisión directiva
   */
  async getBoardConfidence(clubId, managerId) {
    if (!clubId) return null

    const { data: board, error } = await supabase
      .from('club_board_confidence')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('Error consultando club_board_confidence:', error)
    }

    if (board) return board

    // Inicializar autoritativamente si no existe
    const initialBoard = {
      club_id: clubId,
      manager_id: managerId || null,
      season_year: 1,
      confidence_score: 70,
      sports_satisfaction: 70,
      financial_satisfaction: 70,
      squad_satisfaction: 70,
      season_objective: 'MID_TABLE',
      is_under_ultimatum: false,
      ultimatum_points_required: 0,
      ultimatum_matches_remaining: 0,
      ultimatum_points_gathered: 0
    }

    const { data: created, error: insertErr } = await ensureRow(supabase, 'club_board_confidence', initialBoard, 'club_id')

    if (insertErr) {
      console.warn('Error al insertar club_board_confidence:', insertErr)
      return { id: 'temp', ...initialBoard }
    }

    // Registrar reunión inicial de fijación de objetivos
    await supabase.from('board_meetings_log').insert({
      club_id: clubId,
      manager_id: managerId || null,
      meeting_reason: 'SEASON_OBJECTIVES_SET',
      board_statement: 'Bienvenido. La comisión directiva aspira a consolidar al equipo en la categoría y cuidar el patrimonio del club.',
      manager_response: 'Acepto el desafío. Pondremos disciplina y trabajo diario para honrar la camiseta.'
    })

    return created
  },

  /**
   * Actualiza la confianza dirigencial tras un partido oficial
   */
  async updateConfidenceAfterMatch({ clubId, managerId, isWin, isDraw }) {
    if (!clubId) return null

    const board = await this.getBoardConfidence(clubId, managerId)
    // La parte numérica es una función pura (domain/boardConfidence.js); acá solo se aplican sus consecuencias
    const verdict = evaluateBoardAfterMatch(board, { isWin, isDraw })
    const { sports, globalConfidence, isUnderUltimatum, pointsRequired, matchesRemaining, pointsGathered } = verdict
    const ultimatumEvent = verdict.event

    if (verdict.event === 'SURVIVED') {
      await supabase.from('board_meetings_log').insert({
        club_id: clubId,
        manager_id: managerId || null,
        meeting_reason: 'ULTIMATUM_SURVIVED',
        board_statement: 'La directiva reconoce la respuesta del equipo en los momentos decisivos y ratifica formalmente al DT.',
        manager_response: 'El grupo demostró carácter y unión para salir adelante.'
      })
    } else if (verdict.event === 'ISSUED') {
      await supabase.from('board_meetings_log').insert({
        club_id: clubId,
        manager_id: managerId || null,
        meeting_reason: 'ULTIMATUM_ISSUED',
        board_statement: 'Cumbre de crisis urgente: La directiva exige conseguir al menos 4 puntos en los próximos 3 partidos o deberemos rescindir su contrato.',
        manager_response: 'Asumo la responsabilidad. Buscaremos los resultados necesarios de inmediato.'
      })
    }
    if (verdict.dismissal) await this.executeManagerDismissal(clubId, managerId, verdict.dismissal, globalConfidence)

    const updates = {
      confidence_score: globalConfidence,
      sports_satisfaction: sports,
      is_under_ultimatum: isUnderUltimatum,
      ultimatum_points_required: pointsRequired,
      ultimatum_matches_remaining: matchesRemaining,
      ultimatum_points_gathered: pointsGathered,
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('club_board_confidence')
      .update(updates)
      .eq('club_id', clubId)

    // Sincronizar en clubs para compatibilidad
    await supabase
      .from('clubs')
      .update({ board_confidence: globalConfidence })
      .eq('id', clubId)

    queryCache.invalidate(`board:${clubId}`)
    queryCache.invalidate(`club:screen:${clubId}`)

    return {
      globalConfidence,
      isUnderUltimatum,
      matchesRemaining,
      pointsGathered,
      pointsRequired,
      ultimatumEvent
    }
  },

  /**
   * Obtiene el historial de reuniones dirigenciales
   */
  async getBoardMeetings(clubId) {
    if (!clubId) return []
    const { data, error } = await supabase
      .from('board_meetings_log')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.warn('Error consultando board_meetings_log:', error)
      return []
    }
    return data || []
  },

  /**
   * Petición formal a la comisión directiva de inyección de fondos extraordinarios
   */
  async requestEmergencyFunding(clubId, managerId) {
    if (!clubId) throw new Error('Club inválido')

    const board = await this.getBoardConfidence(clubId, managerId)
    if ((board.confidence_score || 0) < 55) {
      throw new Error('La directiva rechaza tu solicitud. No gozas de suficiente respaldo político para pedir partidas extraordinarias.')
    }

    const fundingAmount = 15000.00
    await financesApi.moveCash({ clubId, amount: fundingAmount, category: 'SUBSIDY', description: 'Aporte extraordinario de tesorería concedido por la Comisión Directiva' })

    // Descuenta satisfacción financiera
    const newFin = Math.max(20, (board.financial_satisfaction || 70) - 15)
    await supabase
      .from('club_board_confidence')
      .update({ 
        financial_satisfaction: newFin,
        confidence_score: Math.max(25, (board.confidence_score || 70) - 5),
        updated_at: new Date().toISOString() 
      })
      .eq('club_id', clubId)

    await supabase.from('board_meetings_log').insert({
      club_id: clubId,
      manager_id: managerId || null,
      meeting_reason: 'CRISIS_WARNING',
      board_statement: `Se aprueba una inyección de emergencia de $${fundingAmount.toLocaleString()}. La comisión directiva espera ver un retorno deportivo tangible.`,
      manager_response: 'Agradezco el esfuerzo financiero de la institución.'
    })

    queryCache.invalidate(`board:${clubId}`)
    queryCache.invalidate(`club:screen:${clubId}`)

    return {
      success: true,
      amount: fundingAmount,
      message: `¡Fondos aprobados! Se han transferido $${fundingAmount.toLocaleString()} a la tesorería.`
    }
  },

  /**
   * Ejecuta formalmente el despido del Director Técnico
   */
  async executeManagerDismissal(clubId, managerId, reason = 'POOR_SPORTS_RESULTS', finalConfidence = 15) {
    const severance = 3500.00 // Liquidación salarial

    await supabase.from('manager_dismissals_log').insert({
      club_id: clubId,
      manager_id: managerId || null,
      dismissal_reason: reason,
      final_confidence_score: finalConfidence,
      severance_compensation_paid: severance
    })

    await supabase.from('board_meetings_log').insert({
      club_id: clubId,
      manager_id: managerId || null,
      meeting_reason: 'DISMISSAL_EXECUTED',
      board_statement: 'La Comisión Directiva ha resuelto por unanimidad rescindir el contrato del cuerpo técnico. Agradecemos los servicios prestados.',
      manager_response: 'Lamento no haber cumplido los objetivos trazados. Le deseo éxitos al club.'
    })

    // El despido debe tener efecto real: cerrar el ciclo en el club, liberar el banquillo y dejar al DT desempleado
    // (antes se escribía una columna inexistente `status` y el DT seguía en el cargo con el despido solo registrado)
    if (managerId) {
      await supabase
        .from('manager_career_stints')
        .update({ ended_at: new Date().toISOString(), departure_reason: 'SACKED' })
        .eq('manager_id', managerId)
        .eq('club_id', clubId)
        .is('ended_at', null)

      await supabase
        .from('clubs')
        .update({ manager_id: null })
        .eq('id', clubId)

      await supabase
        .from('managers')
        .update({ employment_status: 'UNEMPLOYED', current_contract_wage: 0 })
        .eq('id', managerId)

      try {
        const { reputationApi, REPUTATION_DELTAS } = await import('./reputation')
        await reputationApi.applyReputationDelta({
          managerId,
          eventType: 'DISMISSAL',
          sourceEntityId: `${clubId}:dismissal:${Date.now()}`,
          delta: REPUTATION_DELTAS.dismissal,
          description: 'Despido por decisión de la comisión directiva'
        })
      } catch (repErr) {
        console.warn('Aviso: no se pudo aplicar la penalización de reputación por despido:', repErr)
      }

      queryCache.invalidate('manager:')
      queryCache.invalidate('club:')
      queryCache.invalidate('dashboard:')
    }

    queryCache.invalidate(`board:${clubId}`)
    queryCache.invalidate(`club:screen:${clubId}`)
  },

  /**
   * Obtiene la categoría de estado de la relación dirigencial
   */
  getBoardStatusMetadata(score = 70, isUnderUltimatum = false) {
    if (isUnderUltimatum) {
      return BOARD_STATUSES.CRITICAL_ULTIMATUM
    }
    if (score >= 80) return BOARD_STATUSES.FULL_CONFIDENCE
    if (score >= 55) return BOARD_STATUSES.STABLE
    if (score >= 40) return BOARD_STATUSES.UNDER_WATCH
    if (score >= 20) return BOARD_STATUSES.CRITICAL_ULTIMATUM
    return BOARD_STATUSES.DISMISSAL_IMMINENT
  }
}
