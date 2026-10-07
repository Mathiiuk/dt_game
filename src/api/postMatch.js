import { managerApi } from './manager'
import { moraleApi } from './morale'
import { supabase } from './supabase'
import { gameConfigApi } from './gameConfig'
import { auditApi } from './audit'
import { clubHistoryApi } from './clubHistory'
import { achievementsApi } from './achievements'
import { rollAggravations, AGGRAVATION_EXTRA_WEEKS } from '../domain/matchSquad'
import { queryCache } from '../utils/cache'
import { positionLine } from '../domain/positions'
import { gateSettlement } from '../domain/finances'
import { benchConsequences } from '../domain/squadConsequences'
import { seasonYearOf, weekOfDate } from '../domain/gameWeek'

/**
 * ¿El gol del evento lo hizo este jugador? Si el evento trae `playerId` manda ese dato; el nombre en el texto sólo
 * se usa en eventos viejos sin id (el texto también nombra al asistidor, que no debe sumar el gol).
 */
export const isGoalBy = (event, player) => {
  if (event.type !== 'GOAL') return false
  if (event.playerId) return event.playerId === player.id
  return !!event.text?.includes(`Golazo de ${player.first_name} ${player.last_name}`)
}

/** Jugadores que participaron: los titulares indicados o, sin dato, todo el plantel */
export const selectParticipants = (players = [], starterIds) => {
  if (!starterIds || starterIds.length === 0) return players
  const set = new Set(starterIds)
  return players.filter(p => set.has(p.id))
}

/** [{player_id, goals}] -> ['p1','p1','p2'] (un id por gol), formato que espera el historial de jugadores */
export const scorersFromRatings = (ratings = []) => ratings.flatMap(r => Array(r.goals || 0).fill(r.player_id))

// Señal interna para saltear la tirada de lesión nueva de un jugador que ya jugó lesionado
class SkipInjuryRoll extends Error {}

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
    // Un partido cambia tabla, plantel, caja, próximo partido y más: se descarta TODA la caché al terminar,
    // para que Inicio y el resto de las pantallas no sigan mostrando el partido que ya se jugó.
    const run = () => this._processResult(managerId, clubId, result, fixtureId)
      .then((res) => { queryCache.clear(); return res })

    if (!fixtureId) return run()

    if (!postMatchInFlight.has(fixtureId)) {
      const promise = run().finally(() => postMatchInFlight.delete(fixtureId))
      postMatchInFlight.set(fixtureId, promise)
    }
    return postMatchInFlight.get(fixtureId)
  },

  /**
   * Alarga la lesión activa de los jugadores que jugaron lesionados y empeoraron
   */
  async _applyAggravations(clubId, playerIds) {
    for (const playerId of playerIds) {
      try {
        const { data: injury } = await supabase
          .from('player_injuries')
          .select('id, weeks_remaining, weeks_total')
          .eq('club_id', clubId)
          .eq('player_id', playerId)
          .eq('is_cleared', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!injury) continue
        await supabase.rpc('batch_update_injuries', {
          rows: [{ id: injury.id, weeks_remaining: injury.weeks_remaining + AGGRAVATION_EXTRA_WEEKS, is_cleared: false }]
        })
        const { playerApi } = await import('./player')
        await playerApi.batchUpdate([{ id: playerId, injury_days: (injury.weeks_remaining + AGGRAVATION_EXTRA_WEEKS) * 7 }])
      } catch (e) {
        console.warn('Aviso: no se pudo registrar el agravamiento de la lesión:', e)
      }
    }
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

    // 2. XP del Director Técnico (Fase 05). El plantel se pide a la vez que la configuración de XP, y la XP se
    // acredita en segundo plano mientras se procesa el resto (se espera antes de devolver el resultado)
    // (las consultas de supabase arrancan al esperarlas: Promise.resolve las dispara ya)
    const playersRequest = Promise.resolve(supabase
      .from('players')
      .select('*')
      .eq('club_id', clubId)
      .eq('is_retired', false))
    const [winXp, drawXp, lossXp] = await Promise.all([
      gameConfigApi.getNumber('xp_per_win', 50),
      gameConfigApi.getNumber('xp_per_draw', 20),
      gameConfigApi.getNumber('xp_per_loss', 5)
    ])
    const xpAward = isWin ? winXp : isDraw ? drawXp : lossXp

    const xpWrite = (async () => {
      if (!managerId) return
      try {
        await managerApi.addXp(managerId, xpAward, 'MATCH_RESULT', fixtureId || `match_${Date.now()}`)
      } catch (e) {
        console.warn('Error acreditando XP:', e)
      }
    })()

    // 3. Obtener jugadores del club y calcular calificaciones individuales
    const { data: players } = await playersRequest

    const playerRatings = []
    const matchEvents = result.events || []

    const postMatchUpdates = []
    const playedIds = []
    const injuredPlayingSet = new Set(result.injuredPlayingIds || [])

    // Sólo los que saltaron a la cancha juegan, se cansan, suman minutos y reciben calificación.
    // (Sin `starterIds`, por compatibilidad con resultados viejos, se toma todo el plantel.)
    const participants = selectParticipants(players, result.starterIds)

    if (participants.length > 0) {
      for (const p of participants) {
        // Calificación de rendimiento (1.0 a 10.0)
        let rating = 6.0

        // Goles y asistencias anotadas por este jugador
        const playerGoals = matchEvents.filter(e => isGoalBy(e, p)).length
        const playerAssists = matchEvents.filter(e => e.assistId === p.id).length
        const playerYellows = matchEvents.filter(e => e.type === 'CARD_YELLOW' && e.playerId === p.id).length
        const playerReds = matchEvents.filter(e => e.type === 'CARD_RED' && e.playerId === p.id).length

        rating += playerGoals * 1.25
        rating += playerAssists * 0.75

        // Bono por valla invicta para arquero y defensas
        const isDefender = ['ARQ', 'DEF'].includes(positionLine(p.position))
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
        // Un lesionado que jugó no sufre una lesión nueva: se evalúa aparte si agrava la que ya tenía
        const playedInjured = injuredPlayingSet.has(p.id)
        let playerInjured = false
        try {
          if (playedInjured) throw new SkipInjuryRoll()
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
          if (!(injErr instanceof SkipInjuryRoll)) console.warn('Aviso: error evaluando lesión en post-partido:', injErr)
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

        // Estado físico y moral (si no se gestionó por lesión): se aplica en lote al final del bucle
        if (!playerInjured) {
          postMatchUpdates.push({ id: p.id, state_fitness: newFitness, state_morale: newMorale })
        }
        playedIds.push(p.id)
      }

      // El resto del plantel no juega ni se cansa, pero igual vive el resultado: la mitad del impacto en la moral
      const participantIds = new Set(participants.map(p => p.id))
      const benchDelta = isWin ? 4 : (isDraw ? 0 : (goalsConceded - goalsScored >= 3 ? -7 : -4))
      for (const p of players || []) {
        if (participantIds.has(p.id)) continue
        postMatchUpdates.push({ id: p.id, state_morale: Math.max(10, Math.min(100, (p.morale || p.state_morale || 70) + benchDelta)) })
      }

      // Lesionados que jugaron: 35% de agravar la lesión (+2 semanas)
      await this._applyAggravations(clubId, rollAggravations([...injuredPlayingSet]))

      // Una sola llamada para el estado de todo el plantel y otra para los minutos oficiales (Fase 28)
      try {
        const { playerApi } = await import('./player')
        // El estado de los jugadores y los minutos jugados son escrituras independientes: van juntas
        await Promise.all([
          playerApi.batchUpdate(postMatchUpdates),
          supabase.rpc('increment_players_minutes', { player_ids: playedIds, mins: 90 })
        ])
      } catch (batchErr) {
        console.warn('Aviso: error persistiendo estado físico/minutos del plantel:', batchErr)
      }
    }

    // Elegir MVP (calificación más alta)
    playerRatings.sort((a, b) => b.rating - a.rating)
    const mvp = playerRatings[0] || null

    // 4. Datos del club y liquidación de taquilla (Tier 5 realista)
    const { data: clubData } = await supabase
      .from('clubs')
      .select('budget, board_confidence, stadium_capacity, ticket_price, game_date')
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
          recentWins: (await moraleApi.getStreaks(clubId, 5)).results.filter(r => r === 'W').length
        })
      } catch (err) {
        console.warn('Fallback attendance computation:', err)
      }

      attendance = computed?.attendance || Math.round(capacity * 0.75)
      const gate = gateSettlement(attendance, ticketPrice)
      grossIncome = gate.gross
      operatingCost = gate.operating // seguridad, árbitros y logística
      netIncome = gate.net

      if (clubData && netIncome > 0) {
        // La taquilla entra por el servidor, una sola vez por partido (la referencia evita acreditarla dos veces).
        // El cobro, la auditoría, la atmósfera de la tribuna y el desgaste del césped no dependen entre sí
        await Promise.all([
          (async () => {
            try {
              const { financesApi } = await import('./finances')
              await financesApi.moveCash({
                clubId, amount: netIncome, category: 'MATCH_DAY', allowNegative: true,
                description: `Taquilla: ${attendance} espectadores a $${ticketPrice} (neto de seguridad y logística)`,
                ref: fixtureId ? `gate:${fixtureId}` : null
              })
            } catch (ledgerErr) {
              console.warn('Aviso: no se pudo acreditar la taquilla:', ledgerErr)
            }
          })(),
          Promise.resolve(auditApi.logAction({
            whoId: managerId,
            action: 'MATCH_GATE_RECEIPTS',
            entityType: 'club',
            entityId: clubId,
            stateBefore: { budget: clubData.budget },
            stateAfter: { budget: Number(clubData.budget || 0) + netIncome, netIncome, attendance }
          })).catch((auditErr) => console.warn('Aviso: no se pudo auditar la taquilla:', auditErr)),
          (async () => {
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
          })(),
          (async () => {
            // Regla 21.2: Desgaste gradual del césped (-3 pts)
            try {
              const { stadiumApi } = await import('./stadium')
              await stadiumApi.degradePitchHomeMatch(clubId)
            } catch (stErr) {
              console.warn('Aviso: no se pudo actualizar desgaste de césped:', stErr)
            }
          })()
        ])
      }
    }

    // 5 y 5a. La confianza de la directiva y las consecuencias del resultado tocan las mismas filas del club: van en orden
    const clubChain = async () => {
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

      // 5a. Consecuencias del resultado: rachas, goleadas, clásico y hinchada de visitante (clima del club)
      try {
        const { climateApi } = await import('./climate')
        await climateApi.applyMatchConsequences({ clubId, fixtureId, result, gameDate: clubData?.game_date || null })

        // Referentes en el banco: el capitán y el ídolo que no juegan se notan en el vestuario y en la tribuna
        if (result.starterIds?.length && players?.length) {
          const { data: locker } = await supabase.from('club_locker_room').select('captain_player_id').eq('club_id', clubId).maybeSingle()
          const played = new Set(selectParticipants(players, result.starterIds).map(x => x.id))
          const captainBenched = Boolean(locker?.captain_player_id) && !played.has(locker.captain_player_id)
          const idolBenched = players.some(x => x.is_idol && !x.is_injured && !played.has(x.id))
          await climateApi.applySquadConsequence({
            clubId, source: 'BENCH', gameDate: clubData?.game_date || null,
            effects: benchConsequences({ captainBenched, idolBenched }, climateApi.difficulty)
          })
        }
      } catch (climateErr) {
        console.warn('Aviso: no se pudieron aplicar las consecuencias del partido:', climateErr)
      }
    }

    // 5b, 5c, 6 y 7 escriben en tablas distintas (carrera, reputación, informe del partido, historia): corren juntos
    const sideTasks = [
      (async () => {
        // 5b. Registrar partido en el ciclo activo de carrera del DT (Fase 31)
        if (managerId && clubId) {
          try {
            const { careerApi } = await import('./career')
            await careerApi.recordMatchInStint(managerId, clubId, isWin, isDraw, !isWin && !isDraw)
          } catch (stintErr) {
            console.warn('Aviso: no se pudo actualizar stint de carrera del DT:', stintErr)
          }
        }

      })(),
      (async () => {
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

      })(),
      (async () => {
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

      })(),
      (async () => {
        // 7. Historia y Progresión de Ídolos / Récords
        try {
          await clubHistoryApi.processPostMatchPlayerStats(clubId, {
            playedPlayerIds: participants.map(p => p.id),
            scorers: scorersFromRatings(playerRatings),
            homeScore: result.homeScore || 0,
            awayScore: result.awayScore || 0,
            opponentName: result.opponentName || 'Rival',
            isHome: result.isHome
          })
        } catch (err) {
          console.warn('Error en clubHistory:', err)
        }

      })()
    ]

    await Promise.all([clubChain(), ...sideTasks])

    // 8. Logros de carrera
    try {
      achievementsApi.evaluateAchievements(managerId, clubId).catch(() => {})
    } catch (e) {
      // Los logros no frenan el cierre del partido
    }

    await xpWrite

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
