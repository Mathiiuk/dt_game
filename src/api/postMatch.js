import { managerApi } from './manager'
import { supabase } from './supabase'
import { gameConfigApi } from './gameConfig'
import { auditApi } from './audit'
import { clubHistoryApi } from './clubHistory'
import { achievementsApi } from './achievements'

export const postMatchApi = {
  /**
   * Procesa de forma autoritativa e idempotente las consecuencias deportivas, físicas y financieras del partido.
   */
  async processResult(managerId, clubId, result, fixtureId = null) {
    // 1. Idempotencia: Verificar si este partido ya fue procesado en match_reports
    if (fixtureId) {
      try {
        const { data: existingReport } = await supabase
          .from('match_reports')
          .select('*')
          .eq('fixture_id', fixtureId)
          .maybeSingle()

        if (existingReport) {
          const { data: existingPlayerStats } = await supabase
            .from('player_match_stats')
            .select('*, player:players(*)')
            .eq('fixture_id', fixtureId)

          return {
            idempotent: true,
            report: existingReport,
            playerRatings: existingPlayerStats || [],
            attendance: existingReport.attendance,
            matchIncome: Number(existingReport.gate_receipts_gross) * 0.85,
            grossIncome: Number(existingReport.gate_receipts_gross),
            xpAward: existingReport.match_xp_awarded,
            mvpPlayerId: existingReport.mvp_player_id
          }
        }
      } catch (err) {
        console.warn('Aviso: error comprobando reporte existente:', err)
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
          fitness_after_match: newFitness,
          morale_delta: moraleDelta
        })

        // Persistir estado físico y moral
        await supabase
          .from('players')
          .update({
            state_fitness: newFitness,
            state_morale: newMorale
          })
          .eq('id', p.id)
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
      // 70% a 92% de ocupación
      const rate = 0.70 + Math.random() * 0.22
      attendance = Math.round(capacity * rate)
      const ticketPrice = Number(clubData?.ticket_price) || 10.0
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

        // Regla 21.2: Desgaste gradual del césped (-3 pts)
        try {
          const { stadiumApi } = await import('./stadium')
          await stadiumApi.degradePitchHomeMatch(clubId)
        } catch (stErr) {
          console.warn('Aviso: no se pudo actualizar desgaste de césped:', stErr)
        }
      }
    }

    // 5. Ajustar confianza de la directiva
    if (clubData) {
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

    // 6. Registrar match_reports y player_match_stats en BD
    try {
      if (fixtureId) {
        await supabase.from('match_reports').insert({
          fixture_id: fixtureId,
          home_club_id: result.isHome ? clubId : null,
          away_club_id: !result.isHome ? clubId : null,
          final_score: `${result.homeScore} - ${result.awayScore}`,
          attendance,
          gate_receipts_gross: grossIncome,
          match_xp_awarded: xpAward,
          mvp_player_id: mvp?.player_id || null
        })

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
