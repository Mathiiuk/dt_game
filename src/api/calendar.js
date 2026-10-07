import { supabase } from './supabase'
import { FIXTURE_OPEN_STATUSES } from '../domain/fixtureStatus'
import { seasonYearOf, weekOfDate } from '../domain/gameWeek'
import { timed } from '../lib/perf'

export { seasonYearOf, weekOfDate }

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


const toDay = (d) => String(d).slice(0, 10)

export const calendarApi = {
  /** Id de la carrera activa del DT (sesión más reciente); null si no hay */
  async resolveCareerId(managerId) {
    if (!managerId) return null
    try {
      const { data: manager } = await supabase.from('managers').select('user_id').eq('id', managerId).single()
      if (!manager?.user_id) return null
      const { data: session } = await supabase
        .from('user_sessions')
        .select('active_career_id')
        .eq('user_id', manager.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return session?.active_career_id || null
    } catch {
      return null
    }
  },

  /**
   * La fecha del club (clubs.game_date) es la fuente de verdad del tiempo de juego: el calendario de la carrera
   * puede quedar desfasado (club restablecido, calendario virtual). Alinea semana/fecha/año con el club y lo persiste.
   */
  async reconcileWithClub(calendar, clubId, knownClubDate) {
    if (!clubId) return calendar
    // Si quien llama ya leyó la fecha del club (en paralelo con el calendario), se evita una consulta más
    const clubDay = knownClubDate !== undefined
      ? knownClubDate
      : (await supabase.from('clubs').select('game_date').eq('id', clubId).maybeSingle()).data?.game_date
    const clubDate = clubDay ? toDay(clubDay) : null
    if (!clubDate || clubDate === toDay(calendar.current_date)) return calendar

    const patch = {
      current_date: clubDate,
      current_week: weekOfDate(clubDate),
      current_season_year: seasonYearOf(clubDate),
      season_phase: getSeasonPhase(weekOfDate(clubDate)).id,
      transfer_window_open: isTransferWindowOpen(weekOfDate(clubDate))
    }
    if (calendar.id && !['virtual-calendar', 'temp-calendar', 'fallback-calendar'].includes(calendar.id)) {
      await supabase.from('career_calendar').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', calendar.id)
    }
    return { ...calendar, ...patch }
  },

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
    const calendarState = await this.reconcileWithClub(await this.getOrCreateCalendar(careerId), clubId)
    seasonYear = calendarState.current_season_year || seasonYear

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
    const timings = {}

    // 1. Obtener estado actual
    // El calendario de la carrera y la fecha del club se leen juntos
    const [rawCalendar, clubDateRes] = await Promise.all([
      this.getOrCreateCalendar(careerId),
      clubId ? supabase.from('clubs').select('game_date').eq('id', clubId).maybeSingle() : Promise.resolve({ data: null })
    ])
    const calendar = await this.reconcileWithClub(rawCalendar, clubId, clubDateRes?.data?.game_date ?? null)

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

    // 3b. En la última semana no se avanza: la temporada se cierra desde la gala de fin de temporada
    if (calendar.current_week >= WEEKS_PER_SEASON) {
      const err = new Error('ERR_SEASON_END: La temporada terminó. Cerrala desde la gala de fin de temporada para empezar la siguiente.')
      err.code = 'ERR_SEASON_END'
      throw err
    }

    // 4. Condiciones que frenan el avance. Las tres consultas son independientes: se piden juntas y se evalúan
    // en el mismo orden de siempre (partido de liga, copa continental, dilema crítico)
    if (clubId) {
      const checks = await timed('semana.condiciones', () => Promise.all([
        supabase
          .from('fixtures')
          .select('id, match_date, status')
          .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
          .in('status', FIXTURE_OPEN_STATUSES)
          .lte('match_date', calendar.current_date),
        import('./internationalCup')
          .then(({ internationalCupApi }) => internationalCupApi.hasDueUserMatch(clubId, calendar.current_date))
          .catch((cupErr) => {
            console.warn('Aviso: no se pudo comprobar la copa continental:', cupErr)
            return false
          }),
        import('./events')
          .then(({ eventsApi }) => eventsApi.hasCriticalPendingEvent(clubId))
          .catch(() => false)
      ]), timings)
      const [{ data: pendingMatches }, cupDue, hasCritical] = checks

      if (pendingMatches && pendingMatches.length > 0) {
        const err = new Error('ERR_MATCH_MUST_BE_PLAYED_FIRST: No puedes avanzar de semana sin disputar el partido oficial programado.')
        err.code = 'ERR_MATCH_MUST_BE_PLAYED_FIRST'
        throw err
      }

      // 4a. La copa continental también se juega en su fecha: un partido propio vencido frena el avance
      if (cupDue) {
        const err = new Error('ERR_MATCH_MUST_BE_PLAYED_FIRST: Tenés un partido de la copa continental pendiente. Jugalo antes de avanzar de semana.')
        err.code = 'ERR_MATCH_MUST_BE_PLAYED_FIRST'
        throw err
      }

      // 4b. Regla 35.1: Comprobar eventos críticos no resueltos
      if (hasCritical) {
        const err = new Error('ERR_CRITICAL_EVENT_PENDING: Hay un dilema institucional crítico que requiere tu decisión antes de avanzar la semana.')
        err.code = 'ERR_CRITICAL_EVENT_PENDING'
        throw err
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

      // 7. Cascada semanal. Los pasos que no comparten datos corren en paralelo; los que se leen entre sí,
      // en orden. Cada uno se mide en `timings` (visible en window.__perf en desarrollo).
      if (clubId) {
        const warn = (label) => (e) => console.warn(`Aviso: no se pudo procesar ${label}:`, e)

        // Cadena de jugadores: salud y fatiga, y después el entrenamiento (que lee lo que dejó el paso anterior)
        const playersChain = async () => {
          // Las lecturas del entrenamiento no dependen de los jugadores: se piden junto con ellos
          const { trainingApi } = await import('./training')
          const trainingInputs = trainingApi.prefetchWeekInputs(clubId, calendar.current_week)
          trainingInputs.catch(() => {}) // si el entrenamiento ya no se necesita, que no quede un rechazo sin atender
          // 11d. La recuperación médica (Fase 27) lee y escribe sus propias tablas: arranca ya y devuelve los cambios de los
          // jugadores para guardarlos en la misma escritura que lo semanal y el entrenamiento
          const injuriesRequest = import('./injuries')
            .then(({ injuriesApi }) => timed('semana.lesiones', () => injuriesApi.processWeeklyInjuriesRecovery(clubId, { deferPlayerWrite: true }), timings))
            .catch((injErr) => { warn('la recuperación de lesiones')(injErr); return null })
          const { data: players } = await timed('semana.jugadores.leer', () => supabase.from('players').select('*').eq('club_id', clubId), timings)

          if (players && players.length > 0) {
            playersProcessedCount = players.length
            // Se acumulan los cambios y se aplican en una sola llamada (antes: un UPDATE por jugador)
            const weeklyUpdates = []
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

              weeklyUpdates.push({
                id: p.id,
                state_fitness: updatedFitness,
                injury_days: updatedInjuryDays,
                injury_type: updatedInjuryType,
                is_injured: isInjured
              })
            }
            const { playerApi } = await import('./player')

            // 7.1. Cascada de Entrenamiento y Desarrollo Individual (Fase 08). Trabaja sobre el plantel con los cambios
            // semanales ya aplicados en memoria y devuelve lo suyo: todo se guarda en UNA sola escritura de jugadores
            let finalUpdates = weeklyUpdates
            try {
              const weeklyById = new Map(weeklyUpdates.map(u => [u.id, u]))
              const updatedPlayers = players.filter(p => !p.is_retired).map(p => ({ ...p, ...weeklyById.get(p.id) }))
              const training = await timed('semana.entrenamiento', async () => trainingApi.processWeeklyTraining(
                clubId, calendar.current_week, careerId,
                { inputs: await trainingInputs, players: updatedPlayers, deferPlayerWrite: true }
              ), timings)
              if (training?.playerUpdates?.length) {
                const merged = new Map(weeklyById)
                for (const u of training.playerUpdates) merged.set(u.id, { ...merged.get(u.id), ...u })
                finalUpdates = [...merged.values()]
              }
            } catch (tErr) {
              warn('el entrenamiento semanal')(tErr)
            }
            // Las altas y avances de lesiones se aplican al final: mandan sobre lo semanal y lo del entrenamiento
            const injuries = await injuriesRequest
            if (injuries?.playerUpdates?.length) {
              const merged = new Map(finalUpdates.map(u => [u.id, u]))
              for (const u of injuries.playerUpdates) merged.set(u.id, { ...merged.get(u.id), ...u })
              finalUpdates = [...merged.values()]
            }
            await timed('semana.jugadores.guardar', () => playerApi.batchUpdate(finalUpdates), timings)
          } else {
            await injuriesRequest
          }

          return players || []
        }

        // Pasos independientes de los jugadores del club: liga de la IA, obras del estadio y carrera del DT
        const independent = [
          // 9. La fecha del juego avanza de a 7 días: se juegan todos los partidos de IA vencidos (excepto el del club del usuario)
          import('./competition').then(({ competitionApi }) => timed('semana.liga-ia', () => competitionApi.simulateMatchDay(nextDate, clubId), timings)),
          // 11b. Avance de obras de infraestructura del estadio (Fase 21)
          // 11c. Mentorías de futbolistas (Fase 26): solo tocan mentorías y personalidades, no a la cadena de jugadores
          import('./personalities').then(({ personalitiesApi }) => timed('semana.mentorias', () => personalitiesApi.advanceMentorshipsWeek(clubId), timings)).catch(warn('las mentorías')),
          import('./stadium').then(({ stadiumApi }) => timed('semana.estadio', () => stadiumApi.advanceConstructionWeek(clubId, nextWeek, calendar.current_season_year), timings)).catch(warn('las obras del estadio'))
        ]
        // 11e. Avance de carrera del DT: depósito de salario y expiración de ofertas (Fase 31)
        if (managerId) {
          independent.push(
            import('./career').then(({ careerApi }) => timed('semana.carrera', () => careerApi.processWeeklyManagerProgression(managerId, nextWeek, clubId, careerId), timings)).catch(warn('la carrera del DT'))
          )
        }

        const [players] = await Promise.all([timed('semana.cadena-jugadores', playersChain, timings), ...independent])

        // 8, 10 y 11 usan a los jugadores ya procesados y escriben en columnas distintas del club: van juntos
        const { financesApi } = await import('./finances')
        const { contractApi } = await import('./contracts')
        const { moraleApi } = await import('./morale')
        await Promise.all([
          // 8. Finanzas (salarios semanales e ingresos)
          timed('semana.finanzas', () => financesApi.processWeek({ clubId, careerId, seasonYear: calendar.current_season_year, weekNumber: nextWeek }), timings),
          // 10. Ofertas aleatorias del mercado
          timed('semana.ofertas', () => contractApi.generateRandomOffersForWeek(clubId, players, nextTransferWindow), timings),
          // 11. Moral semanal con las rachas reales
          timed('semana.moral', () => moraleApi.processWeeklyMorale(clubId), timings)
        ])

        // 11a y 11f leen la caja y la moral que dejaron los pasos anteriores: van después y en orden
        try {
          const { climateApi } = await import('./climate')
          const { marketApi } = await import('./market')
          await Promise.all([
            timed('semana.clima', () => climateApi.processWeek({ clubId, gameDate: nextDate }), timings),
            // Cuotas de fichajes que vencen esta semana (un solo llamado a la base)
            timed('semana.cuotas', () => marketApi.settleInstallments({ clubId, gameDate: nextDate }), timings)
          ])
          await timed('semana.clima-barra', () => climateApi.advanceWeek({ clubId, managerId, careerId, week: nextWeek, gameDate: nextDate }), timings)
          const { eventsApi } = await import('./events')
          await timed('semana.eventos', () => eventsApi.generateWeeklyEvents(clubId, managerId, nextWeek, careerId), timings)
        } catch (evtErr) {
          warn('el clima y los eventos semanales')(evtErr)
        }

        // Sincronizar fecha en clubs para compatibilidad
        await supabase
          .from('clubs')
          .update({ game_date: nextDate })
          .eq('id', clubId)
      }

      // 12. El cierre de la temporada no pasa por acá: la semana 52 frena el avance y se cierra desde la gala
      const seasonCompleted = false

      // 13 y 14. El estado del calendario y la auditoría del avance son independientes: se guardan juntos
      const durationMs = Date.now() - startTime
      await Promise.all([
        (async () => {
          // 13. Actualizar estado del calendario autoritativo
          if (calendar.id && calendar.id !== 'virtual-calendar' && calendar.id !== 'temp-calendar') {
            await supabase
              .from('career_calendar')
              .update({
                current_week: nextWeek,
                current_season_year: calendar.current_season_year,
                current_date: nextDate,
                season_phase: nextPhase.id,
                transfer_window_open: nextTransferWindow,
                is_advancing: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', calendar.id)
          }
        })(),
        (async () => {
          // 14. Registrar auditoría en time_advance_log
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
        })()
      ])

      return {
        success: true,
        timings: { total: durationMs, ...timings },
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
