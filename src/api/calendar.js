import { supabase } from './supabase'
import { FIXTURE_OPEN_STATUSES } from '../domain/fixtureStatus'

export const WEEKS_PER_SEASON = 52

export const SEASON_PHASES = {
  PRE_SEASON: { id: 'PRE_SEASON', label: 'Pretemporada', startWeek: 1, endWeek: 2 },
  REGULAR_SEASON_APERTURA: { id: 'REGULAR_SEASON_APERTURA', label: 'Torneo Apertura', startWeek: 3, endWeek: 21 },
  MID_SEASON_BREAK: { id: 'MID_SEASON_BREAK', label: 'Receso de Invierno', startWeek: 22, endWeek: 25 },
  REGULAR_SEASON_CLAUSURA: { id: 'REGULAR_SEASON_CLAUSURA', label: 'Torneo Clausura', startWeek: 26, endWeek: 44 },
  POST_SEASON: { id: 'POST_SEASON', label: 'Postemporada / Liguilla', startWeek: 45, endWeek: 52 }
}

export const CALENDAR_CONFIG = {
  weeks_per_season: WEEKS_PER_SEASON,
  summer_transfer_window: { start: 1, end: 6 },
  winter_transfer_window: { start: 22, end: 25 },
  youth_intake_week: 35,
  weekly_base_stamina_recovery: 20
}

export const getSeasonPhase = (week) => {
  if (week <= 2) return SEASON_PHASES.PRE_SEASON
  if (week <= 21) return SEASON_PHASES.REGULAR_SEASON_APERTURA
  if (week <= 25) return SEASON_PHASES.MID_SEASON_BREAK
  if (week <= 44) return SEASON_PHASES.REGULAR_SEASON_CLAUSURA
  return SEASON_PHASES.POST_SEASON
}

export const isTransferWindowOpen = (week) => {
  return (week >= CALENDAR_CONFIG.summer_transfer_window.start && week <= CALENDAR_CONFIG.summer_transfer_window.end) ||
         (week >= CALENDAR_CONFIG.winter_transfer_window.start && week <= CALENDAR_CONFIG.winter_transfer_window.end)
}

export const calendarApi = {
  /**
   * Obtiene o inicializa la línea de tiempo autoritativa para la carrera dada.
   */
  async getOrCreateCalendar(careerId, initialDate = '2026-07-01') {
    if (!careerId) {
      // Si aún no hay career_id explícito, creamos o usamos un estado virtual
      return {
        id: 'virtual-calendar',
        career_id: null,
        current_season_year: 2026,
        current_week: 1,
        current_date: initialDate,
        season_phase: 'PRE_SEASON',
        transfer_window_open: true,
        is_advancing: false
      }
    }

    try {
      const { data, error } = await supabase
        .from('career_calendar')
        .select('*')
        .eq('career_id', careerId)
        .maybeSingle()

      if (data) return data

      // Si no existe, lo inicializamos
      const newCalendar = {
        career_id: careerId,
        current_season_year: 2026,
        current_week: 1,
        current_date: initialDate,
        season_phase: 'PRE_SEASON',
        transfer_window_open: true,
        is_advancing: false
      }

      const { data: created, error: insertError } = await supabase
        .from('career_calendar')
        .insert(newCalendar)
        .select()
        .single()

      if (insertError) {
        console.warn('No se pudo insertar career_calendar en DB, usando estado en memoria:', insertError)
        return { id: 'temp-calendar', ...newCalendar }
      }

      return created
    } catch (err) {
      console.warn('Error accediendo a career_calendar:', err)
      return {
        id: 'fallback-calendar',
        career_id: careerId,
        current_season_year: 2026,
        current_week: 1,
        current_date: initialDate,
        season_phase: 'PRE_SEASON',
        transfer_window_open: true,
        is_advancing: false
      }
    }
  },

  /**
   * Obtiene la estructura anual de 52 semanas con partidos y eventos clave.
   */
  async getSeasonCalendar(careerId, clubId, seasonYear = 2026) {
    let calendarState = await this.getOrCreateCalendar(careerId)

    // Obtener partidos programados para el club
    let clubFixtures = []
    try {
      if (clubId) {
        const { data: fixtures } = await supabase
          .from('fixtures')
          .select('id, match_date, home_club_id, away_club_id, home_score, away_score, status, round')
          .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
          .order('match_date', { ascending: true })

        if (fixtures) clubFixtures = fixtures
      }
    } catch (e) {
      console.warn('Error leyendo fixtures para calendario:', e)
    }

    // Construir las 52 semanas del año comenzando desde la fecha base
    const baseDate = new Date(`${seasonYear}-07-01T00:00:00`)
    const weeks = []

    for (let w = 1; w <= WEEKS_PER_SEASON; w++) {
      const weekDate = new Date(baseDate)
      weekDate.setDate(baseDate.getDate() + (w - 1) * 7)
      const dateString = weekDate.toISOString().split('T')[0]

      const phase = getSeasonPhase(w)
      const windowOpen = isTransferWindowOpen(w)

      // Eventos especiales de la semana
      const events = []
      if (w === 1) events.push({ type: 'TRANSFER_OPEN', label: 'Apertura Libro de Pases de Verano' })
      if (w === CALENDAR_CONFIG.summer_transfer_window.end) events.push({ type: 'TRANSFER_DEADLINE', label: 'Cierre de Mercado Verano' })
      if (w === 3) events.push({ type: 'LEAGUE_START', label: 'Inicio Torneo Apertura' })
      if (w === 21) events.push({ type: 'LEAGUE_END', label: 'Fin Torneo Apertura' })
      if (w === 22) events.push({ type: 'TRANSFER_OPEN', label: 'Apertura Libro de Pases de Invierno' })
      if (w === CALENDAR_CONFIG.winter_transfer_window.end) events.push({ type: 'TRANSFER_DEADLINE', label: 'Cierre de Mercado Invierno' })
      if (w === 26) events.push({ type: 'LEAGUE_START', label: 'Inicio Torneo Clausura' })
      if (w === CALENDAR_CONFIG.youth_intake_week) events.push({ type: 'YOUTH_INTAKE', label: 'Camada Anual de Juveniles' })
      if (w === 44) events.push({ type: 'LEAGUE_END', label: 'Fin Torneo Clausura' })
      if (w === 52) events.push({ type: 'SEASON_FINALE', label: 'Balance Anual y Premiaciones' })

      // Match asociado si existe
      const nextWeekDate = new Date(weekDate)
      nextWeekDate.setDate(nextWeekDate.getDate() + 7)
      const nextDateString = nextWeekDate.toISOString().split('T')[0]

      const match = clubFixtures.find(f => f.match_date >= dateString && f.match_date < nextDateString)

      weeks.push({
        weekNumber: w,
        date: dateString,
        phase: phase.id,
        phaseLabel: phase.label,
        transferWindowOpen: windowOpen,
        isCurrent: w === calendarState.current_week,
        isPast: w < calendarState.current_week,
        isFuture: w > calendarState.current_week,
        events,
        match: match || null
      })
    }

    return {
      currentState: calendarState,
      weeks
    }
  },

  /**
   * Avance temporal semanal autoritativo con mutex y bloqueo optimista.
   */
  async advanceWeek({ careerId, clubId, managerId, expectedCurrentWeek }) {
    const startTime = Date.now()

    // 1. Obtener estado actual
    const calendar = await this.getOrCreateCalendar(careerId)

    // 2. Control de concurrencia y Mutex
    if (calendar.is_advancing) {
      const err = new Error('ERR_TIME_ADVANCE_IN_PROGRESS: El motor de tiempo está procesando una semana en este instante.')
      err.code = 'ERR_TIME_ADVANCE_IN_PROGRESS'
      throw err
    }

    // 3. Optimistic lock por semana esperada
    if (expectedCurrentWeek !== undefined && expectedCurrentWeek !== null && calendar.current_week !== expectedCurrentWeek) {
      const err = new Error(`ERR_STALE_WEEK_VERSION: Conflicto de versión. El servidor está en la semana ${calendar.current_week}, pero el cliente envió la semana ${expectedCurrentWeek}.`)
      err.code = 'ERR_STALE_WEEK_VERSION'
      throw err
    }

    // 4. Comprobar que no haya un partido pendiente hoy que deba jugarse obligatoriamente
    if (clubId) {
      const { data: pendingMatches } = await supabase
        .from('fixtures')
        .select('id, match_date, status')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .in('status', FIXTURE_OPEN_STATUSES)
        .lte('match_date', calendar.current_date)

      if (pendingMatches && pendingMatches.length > 0) {
        const err = new Error('ERR_MATCH_MUST_BE_PLAYED_FIRST: No puedes avanzar de semana sin disputar el partido oficial programado.')
        err.code = 'ERR_MATCH_MUST_BE_PLAYED_FIRST'
        throw err
      }

      // 4b. Regla 35.1: Comprobar eventos críticos no resueltos
      try {
        const { eventsApi } = await import('./events')
        const hasCritical = await eventsApi.hasCriticalPendingEvent(clubId)
        if (hasCritical) {
          const err = new Error('ERR_CRITICAL_EVENT_PENDING: Hay un dilema institucional crítico que requiere tu decisión antes de avanzar la semana.')
          err.code = 'ERR_CRITICAL_EVENT_PENDING'
          throw err
        }
      } catch (evtErr) {
        if (evtErr.code === 'ERR_CRITICAL_EVENT_PENDING') throw evtErr
      }
    }

    // 5. Adquirir semáforo
    if (calendar.id && calendar.id !== 'virtual-calendar' && calendar.id !== 'temp-calendar') {
      await supabase
        .from('career_calendar')
        .update({ is_advancing: true, updated_at: new Date().toISOString() })
        .eq('id', calendar.id)
    }

    try {
      // 6. Calcular próxima semana y fecha (+7 días)
      const nextWeek = calendar.current_week + 1
      const currentDateObj = new Date(calendar.current_date)
      currentDateObj.setDate(currentDateObj.getDate() + 7)
      const nextDate = currentDateObj.toISOString().split('T')[0]
      const nextPhase = getSeasonPhase(nextWeek)
      const nextTransferWindow = isTransferWindowOpen(nextWeek)

      let injuriesRecoveredCount = 0
      let staminaRecoveredCount = 0
      let playersProcessedCount = 0

      // 7. Cascada Semanal: Jugadores (Salud, Fitness, Lesiones)
      if (clubId) {
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .eq('club_id', clubId)

        if (players && players.length > 0) {
          playersProcessedCount = players.length
          for (const p of players) {
            let updatedFitness = p.state_fitness || 70
            let updatedInjuryDays = p.injury_days || 0
            let updatedInjuryType = p.injury_type || null
            let isInjured = p.is_injured

            if (updatedInjuryDays > 0) {
              updatedInjuryDays = Math.max(0, updatedInjuryDays - 7)
              if (updatedInjuryDays === 0) {
                updatedInjuryType = null
                isInjured = false
                updatedFitness = Math.max(60, updatedFitness)
                injuriesRecoveredCount++
              }
            } else {
              // Recuperación de fatiga (+15 a +25 stamina semanal, capped en 100)
              const recovery = CALENDAR_CONFIG.weekly_base_stamina_recovery
              updatedFitness = Math.min(100, updatedFitness + recovery)
              staminaRecoveredCount++
            }

            await supabase
              .from('players')
              .update({
                state_fitness: updatedFitness,
                injury_days: updatedInjuryDays,
                injury_type: updatedInjuryType,
                is_injured: isInjured
              })
              .eq('id', p.id)
          }

          // 7.1. Cascada de Entrenamiento y Desarrollo Individual (Fase 08)
          try {
            const { trainingApi } = await import('./training')
            await trainingApi.processWeeklyTraining(clubId, calendar.current_week, careerId)
          } catch (tErr) {
            console.warn('Aviso: error en cálculo de entrenamiento semanal:', tErr)
          }
        }

        // 8. Cascada de Finanzas (Salarios semanales e ingresos)
        const { economyApi } = await import('./economy')
        await economyApi.processWeeklyFinances(clubId, nextDate, players || [])

        // 9. Simulación de partidos de liga IA
        const { competitionApi } = await import('./competition')
        await competitionApi.simulateMatchDay(nextDate)

        // 10. Mercado de fichajes y ofertas aleatorias
        const { marketApi } = await import('./market')
        const { contractApi } = await import('./contracts')
        await contractApi.generateRandomOffersForWeek(clubId, players || [], nextTransferWindow)

        // 11. Eventos dinámicos y moral
        const { eventsApi } = await import('./events')
        const { moraleApi } = await import('./morale')
        await eventsApi.generateRandomEvents(clubId, managerId)
        await moraleApi.processWeeklyMorale(clubId)

        // 11b. Avance de obras de infraestructura del estadio (Fase 21)
        try {
          const { stadiumApi } = await import('./stadium')
          await stadiumApi.advanceConstructionWeek(clubId, nextWeek, calendar.current_season_year)
        } catch (stErr) {
          console.warn('Aviso: no se pudo procesar avance de obras de estadio:', stErr)
        }

        // 11c. Avance de programas de mentoría de futbolistas (Fase 26)
        try {
          const { personalitiesApi } = await import('./personalities')
          await personalitiesApi.advanceMentorshipsWeek(clubId)
        } catch (persErr) {
          console.warn('Aviso: no se pudo procesar avance de mentorías:', persErr)
        }

        // 11d. Avance de recuperación médica de lesionados (Fase 27)
        try {
          const { injuriesApi } = await import('./injuries')
          await injuriesApi.processWeeklyInjuriesRecovery(clubId)
        } catch (injErr) {
          console.warn('Aviso: no se pudo procesar recuperación de lesiones:', injErr)
        }

        // 11e. Avance de carrera del DT: depósito de salario y expiración de ofertas (Fase 31)
        if (managerId) {
          try {
            const { careerApi } = await import('./career')
            await careerApi.processWeeklyManagerProgression(managerId, nextWeek, clubId, careerId)
          } catch (careerErr) {
            console.warn('Aviso: no se pudo procesar avance de carrera del DT:', careerErr)
          }
        }

        // 11f. Disparo de eventos dinámicos narrativos y dilemas del DT (Fase 35)
        try {
          const { eventsApi } = await import('./events')
          await eventsApi.generateWeeklyEvents(clubId, managerId, nextWeek, careerId)
        } catch (evtErr) {
          console.warn('Aviso: no se pudo procesar eventos dinámicos semanales:', evtErr)
        }

        // Sincronizar fecha en clubs para compatibilidad
        await supabase
          .from('clubs')
          .update({ game_date: nextDate })
          .eq('id', clubId)
      }

      // 12. Fin de temporada si supera semana 52
      let seasonCompleted = false
      if (nextWeek > WEEKS_PER_SEASON) {
        seasonCompleted = true
        const { gameLoopApi } = await import('./gameLoop')
        await gameLoopApi.endSeason(clubId)
      }

      // 13. Actualizar estado del calendario autoritativo
      if (calendar.id && calendar.id !== 'virtual-calendar' && calendar.id !== 'temp-calendar') {
        await supabase
          .from('career_calendar')
          .update({
            current_week: nextWeek > WEEKS_PER_SEASON ? 1 : nextWeek,
            current_season_year: nextWeek > WEEKS_PER_SEASON ? calendar.current_season_year + 1 : calendar.current_season_year,
            current_date: nextDate,
            season_phase: nextPhase.id,
            transfer_window_open: nextTransferWindow,
            is_advancing: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', calendar.id)
      }

      // 14. Registrar auditoría en time_advance_log
      const durationMs = Date.now() - startTime
      try {
        await supabase.from('time_advance_log').insert({
          career_id: careerId || null,
          club_id: clubId || null,
          week_advanced_from: calendar.current_week,
          week_advanced_to: nextWeek,
          financials_processed: true,
          fixtures_simulated_count: 9,
          injuries_updated_count: injuriesRecoveredCount,
          duration_ms: durationMs
        })
      } catch (logErr) {
        console.warn('Aviso: no se pudo persistir time_advance_log:', logErr)
      }

      return {
        success: true,
        week: nextWeek,
        date: nextDate,
        phase: nextPhase,
        seasonCompleted,
        durationMs,
        stats: {
          playersProcessed: playersProcessedCount,
          staminaRecovered: staminaRecoveredCount,
          injuriesRecovered: injuriesRecoveredCount
        }
      }
    } catch (err) {
      // Liberar semáforo en caso de error
      if (calendar.id && calendar.id !== 'virtual-calendar' && calendar.id !== 'temp-calendar') {
        await supabase
          .from('career_calendar')
          .update({ is_advancing: false, updated_at: new Date().toISOString() })
          .eq('id', calendar.id)
      }
      throw err
    }
  }
}
