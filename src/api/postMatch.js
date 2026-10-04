import { managerApi } from './manager'
import { supabase } from './supabase'
import { gameConfigApi } from './gameConfig'
import { auditApi } from './audit'
import { clubHistoryApi } from './clubHistory'
import { achievementsApi } from './achievements'

// Promesas de procesamiento en curso por fixture (deduplica montajes dobles de la pantalla)
const postMatchInFlight = new Map()

export const postMatchApi = {
  /**
   * Devuelve el resultado ya procesado de un partido (idempotencia) o null si todavía no existe
   */
  async _loadProcessedReport(fixtureId) {
    const { data: existingReport } = await supabase
      .from('match_reports')
      .select('*')
      .eq('fixture_id', fixtureId)
      .maybeSingle()

    if (!existingReport) return null

    const { data: existingPlayerStats } = await supabase
      .from('player_match_stats')
      .select('*, player:players(*)')
      .eq('fixture_id', fixtureId)

    const stats = existingPlayerStats || []
    const mvpRow = stats.find(r => r.player_id === existingReport.mvp_player_id)
    return {
      idempotent: true,
      report: existingReport,
      playerRatings: stats.map(r => ({
        player_id: r.player_id,
        name: r.player ? `${r.player.first_name} ${r.player.last_name}` : 'Jugador',
        position: r.player?.position,
        shirt_number: r.player?.shirt_number,
        rating: r.rating,
        goals: r.goals,
        assists: r.assists,
        yellow_cards: r.yellow_cards,
        red_cards: r.red_cards,
        fitness_after_match: r.fitness_after_match,
        morale_delta: r.morale_delta,
        injured: r.fitness_after_match <= 30
      })),
      mvp: mvpRow ? { player_id: mvpRow.player_id, rating: mvpRow.rating } : null,
      attendance: existingReport.attendance,
      matchIncome: Number(existingReport.gate_receipts_gross) * 0.85,
      grossIncome: Number(existingReport.gate_receipts_gross),
      xpAward: existingReport.match_xp_awarded,
      mvpPlayerId: existingReport.mvp_player_id
    }
  },

  /**
   * Procesa de forma autoritativa e idempotente las consecuencias deportivas, físicas y financieras del partido.
   * Garantías (Regla 2.1 #8): una sola ejecución por partido aunque la pantalla se monte dos veces
   * (StrictMode, recarga, doble clic) gracias a (1) una promesa compartida en memoria y (2) un "reclamo"
   * en match_reports (clave única por fixture_id) antes de aplicar lesiones, XP o dinero.
   */
  async processResult(managerId, clubId, result, fixtureId = null) {
    if (!fixtureId) return this._processResult(managerId, clubId, result, fixtureId)

    if (!postMatchInFlight.has(fixtureId)) {
      const promise = this._processResult(managerId, clubId, result, fixtureId)
        .finally(() => postMatchInFlight.delete(fixtureId))
      postMatchInFlight.set(fixtureId, promise)
    }
    return postMatchInFlight.get(fixtureId)
  },

  async _processResult(managerId, clubId, result, fixtureId = null) {
    // 1. Idempotencia: si el partido ya fue procesado, devolver el resultado consolidado
    if (fixtureId) {
      try {
        const existing = await this._loadProcessedReport(fixtureId)
        if (existing) return existing
      } catch (err) {
        console.warn('Aviso: error comprobando reporte existente:', err)
      }

      // Reclamo atómico del partido: sólo un proceso puede continuar (unique fixture_id)
      const { error: claimErr } = await supabase.from('match_reports').insert({
        fixture_id: fixtureId,
        home_club_id: result.isHome ? clubId : null,
        away_club_id: !result.isHome ? clubId : null,
        final_score: `${result.homeScore} - ${result.awayScore}`
      })
      if (claimErr) {
        if (claimErr.code === '23505') {
          const existing = await this._loadProcessedReport(fixtureId)
          if (existing) return existing
        }
        console.warn('Aviso: no se pudo reclamar el partido para procesarlo:', claimErr.message)
      }
    }

    const isWin = (result.isHome && result.homeScore > result.awayScore) || (!result.isHome && result.awayScore > result.homeScore)
    const isDraw = result.homeScore === result.awayScore
    const goalsConceded = result.isHome ? result.awayScore : result.homeScore
    const goalsScored = result.isHome ? result.homeScore : result.awayScore

    // 2. XP del Director Técnico (Fase 05)
    const winXp = await gameConfigApi.getNumber('xp_per_win', 50)
    const drawXp = await gameConfigApi.getNumber('xp_per_draw', 20)
    const lossXp = await gameConfigApi.getNumber('xp_per_loss', 5)
    const xpAward = isWin ? winXp : isDraw ? drawXp : lossXp

    if (managerId) {
      try {
        await managerApi.addXp(managerId, xpAward, 'MATCH_RESULT', fixtureId || `match_${Date.now()}`)
      } catch (e) {
        console.warn('Error acreditando XP:', e)
      }
    }

    // 3. Obtener jugadores del club y calcular calificaciones individuales
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_retired', false)

    const playerRatings = []
    const matchEvents = result.events || []

    if (players && players.length > 0) {
      for (const p of players) {
        // Calificación de rendimiento (1.0 a 10.0)
        let rating = 6.0

        // Goles y asistencias anotadas por este jugador
        const playerGoals = matchEvents.filter(e => e.type === 'GOAL' && (e.playerId === p.id || e.text?.includes(`${p.first_name} ${p.last_name}`))).length
        const playerAssists = matchEvents.filter(e => e.assistId === p.id).length
        const playerYellows = matchEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === p.id).length
        const playerReds = matchEvents.filter(e => e.type === 'CARD_RED' && e.playerId === p.id).length

        rating += playerGoals * 1.25
        rating += playerAssists * 0.75

        // Bono por valla invicta para arquero y defensas
        const isDefender = ['GK', 'DEF', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)
        if (isDefender) {
          if (goalsConceded === 0) rating += 0.80
          else rating -= Math.min(1.5, goalsConceded * 0.35)
        }

        rating -= playerYellows * 0.35
        rating -= playerReds * 2.20

        // Clamp
        rating = Math.round(Math.max(2.0, Math.min(10.0, rating)) * 10) / 10

        // Desgaste físico definitivo
        const stamina = p.attr_stamina || 50
        const fitnessDrain = Math.round(22 - (stamina * 0.08))
        const newFitness = Math.max(0, (p.state_fitness || 80) - fitnessDrain)

        // Impacto en Moral
        let moraleDelta = isWin ? 8 : (isDraw ? 0 : -8)
        if (!isWin && goalsConceded - goalsScored >= 3) {
          moraleDelta = -15 // Goleada en contra
        }
        const newMorale = Math.max(10, Math.min(100, (p.morale || p.state_morale || 70) + moraleDelta))

        // Evaluación de riesgo de lesión en partido (Fase 27)
        let playerInjured = false
        try {
          const { injuriesApi } = await import('./injuries')
          const pitchQual = result.pitchQuality || 70
          const injuryRisk = injuriesApi.calculateInjuryRisk(p, pitchQual)
          // Probabilidad de sufrir percance en los 90 minutos
          if (Math.random() < injuryRisk) {
            await injuriesApi.registerInjury(clubId, p.id, {
              occurred_in_context: 'MATCH',
              career_id: result.careerId || null
            })
            playerInjured = true
          }
        } catch (injErr) {
          console.warn('Aviso: error evaluando lesión en post-partido:', injErr)
        }

        playerRatings.push({
          player_id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          position: p.position,
          shirt_number: p.shirt_number,
          rating,
          goals: playerGoals,
          assists: playerAssists,
          yellow_cards: playerYellows,
          red_cards: playerReds,
          fitness_after_match: playerInjured ? 30 : newFitness,
          morale_delta: moraleDelta,
          injured: playerInjured
        })

        // Persistir estado físico y moral si no se gestionó por lesión
        if (!playerInjured) {
          await supabase
            .from('players')
            .update({
              state_fitness: newFitness,
              state_morale: newMorale
            })
            .eq('id', p.id)
        }

        // Acumular minutos oficiales para curva de maduración y evolución (Fase 28)
        try {
          const { playerEvolutionApi } = await import('./playerEvolution')
          await playerEvolutionApi.trackMatchMinutes(p.id, 90)
        } catch (mErr) {
          console.warn('Aviso: error registrando minutos de partido:', mErr)
        }
      }
    }

    // Elegir MVP (calificación más alta)
    playerRatings.sort((a, b) => b.rating - a.rating)
    const mvp = playerRatings[0] || null

    // 4. Datos del club y liquidación de taquilla (Tier 5 realista)
    const { data: clubData } = await supabase
      .from('clubs')
      .select('budget, board_confidence, stadium_capacity, ticket_price')
      .eq('id', clubId)
      .single()

    let attendance = 0
    let grossIncome = 0
    let operatingCost = 0
    let netIncome = 0

    if (result.isHome) {
      const capacity = clubData?.stadium_capacity || 1500
      const ticketPrice = Number(clubData?.ticket_price) || 10.0

      let computed = null
      try {
        const { fanbaseApi } = await import('./fanbase')
        computed = await fanbaseApi.computeMatchAttendance({
          clubId,
          stadiumCapacity: capacity,
          ticketPrice,
          isDerby: Boolean(result.isDerby),
          recentWins: isWin ? 3 : 1
        })
      } catch (err) {
        console.warn('Fallback attendance computation:', err)
      }

      attendance = computed?.attendance || Math.round(capacity * 0.75)
      grossIncome = Math.round(attendance * ticketPrice)
      operatingCost = Math.round(grossIncome * 0.15) // 15% seguridad y logística
      netIncome = grossIncome - operatingCost

      if (clubData && netIncome > 0) {
        await supabase
          .from('clubs')
          .update({ budget: Number(clubData.budget || 0) + netIncome })
          .eq('id', clubId)

        await auditApi.logAction({
          whoId: managerId,
          action: 'MATCH_GATE_RECEIPTS',
          entityType: 'club',
          entityId: clubId,
          stateBefore: { budget: clubData.budget },
          stateAfter: { budget: Number(clubData.budget || 0) + netIncome, netIncome, attendance }
        })

        // Registrar informe de atmósfera de afición (Fase 22)
        try {
          const { fanbaseApi } = await import('./fanbase')
          await fanbaseApi.recordMatchAtmosphere({
            fixtureId: result.fixtureId || null,
            homeClubId: clubId,
            attendance,
            capacityFillPercentage: computed?.capacityFillPercentage || 75,
            homeAdvantageBonus: computed?.homeAdvantageBonus || 1.02,
            ticketPriceApplied: ticketPrice,
            isWin,
            isDraw,
            isDerby: Boolean(result.isDerby)
          })
        } catch (fbErr) {
          console.warn('Aviso: no se pudo persistir match atmosphere:', fbErr)
        }

        // Regla 21.2: Desgaste gradual del césped (-3 pts)
        try {
          const { stadiumApi } = await import('./stadium')
          await stadiumApi.degradePitchHomeMatch(clubId)
        } catch (stErr) {
          console.warn('Aviso: no se pudo actualizar desgaste de césped:', stErr)
        }
      }
    }

    // 5. Ajustar confianza de la directiva (Fase 23)
    if (clubData) {
      try {
        const { boardApi } = await import('./board')
        await boardApi.updateConfidenceAfterMatch({
          clubId,
          managerId,
          isWin,
          isDraw
        })
      } catch (boardErr) {
        console.warn('Fallback board confidence update:', boardErr)
        let currentConfidence = clubData.board_confidence ?? 80
        if (isWin) currentConfidence += 4
        else if (isDraw) currentConfidence -= 1
        else currentConfidence -= 6
        currentConfidence = Math.max(0, Math.min(100, currentConfidence))

        await supabase
          .from('clubs')
          .update({ board_confidence: currentConfidence })
          .eq('id', clubId)
      }
    }

    // 5b. Registrar partido en el ciclo activo de carrera del DT (Fase 31)
    if (managerId && clubId) {
      try {
        const { careerApi } = await import('./career')
        await careerApi.recordMatchInStint(managerId, clubId, isWin, isDraw, !isWin && !isDraw)
      } catch (stintErr) {
        console.warn('Aviso: no se pudo actualizar stint de carrera del DT:', stintErr)
      }
    }

    // 5c. Actualizar reputación y prestigio del DT con ledger (Fase 32)
    if (managerId) {
      try {
        const { reputationApi, REPUTATION_DELTAS } = await import('./reputation')
        const delta = isWin ? REPUTATION_DELTAS.regular_win : (!isWin && !isDraw ? REPUTATION_DELTAS.regular_loss : 0)
        if (delta !== 0) {
          await reputationApi.applyReputationDelta({
            managerId,
            eventType: 'MATCH_RESULT',
            sourceEntityId: fixtureId || `match_${Date.now()}`,
            delta,
            description: isWin ? 'Victoria en partido oficial' : 'Derrota en partido oficial'
          })
        }
      } catch (repErr) {
        console.warn('Aviso: no se pudo actualizar reputación tras el partido:', repErr)
      }
    }

    // 6. Registrar match_reports y player_match_stats en BD
    try {
      if (fixtureId) {
        await supabase.from('match_reports').upsert({
          fixture_id: fixtureId,
          home_club_id: result.isHome ? clubId : null,
          away_club_id: !result.isHome ? clubId : null,
          final_score: `${result.homeScore} - ${result.awayScore}`,
          attendance,
          gate_receipts_gross: grossIncome,
          match_xp_awarded: xpAward,
          mvp_player_id: mvp?.player_id || null
        }, { onConflict: 'fixture_id' })

        const playerStatsRows = playerRatings.map(pr => ({
          fixture_id: fixtureId,
          player_id: pr.player_id,
          club_id: clubId,
          minutes_played: 90,
          rating: pr.rating,
          goals: pr.goals,
          assists: pr.assists,
          yellow_cards: pr.yellow_cards,
          red_cards: pr.red_cards,
          fitness_after_match: pr.fitness_after_match,
          morale_delta: pr.morale_delta
        }))

        await supabase.from('player_match_stats').insert(playerStatsRows)
      }
    } catch (dbErr) {
      console.warn('Aviso: no se pudo persistir match_reports formal:', dbErr)
    }

    // 7. Historia y Progresión de Ídolos / Récords
    try {
      const playerIds = players ? players.map(p => p.id) : []
      await clubHistoryApi.processPostMatchPlayerStats(clubId, {
        playedPlayerIds: playerIds,
        homeScore: result.homeScore || 0,
        awayScore: result.awayScore || 0,
        opponentName: result.opponentName || 'Rival',
        isHome: result.isHome
      })
    } catch (err) {
      console.warn('Error en clubHistory:', err)
    }

    // 8. Logros de carrera
    try {
      achievementsApi.evaluateAchievements(managerId, clubId).catch(() => {})
    } catch (e) {}

    return {
      xpAward,
      matchIncome: netIncome,
      grossIncome,
      operatingCost,
      attendance,
      playerRatings,
      mvp
    }
  }
}
