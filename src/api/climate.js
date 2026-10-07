import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { moraleApi } from './morale'
import { DIFFICULTY, clamp, matchConsequences, ticketPriceMood, financialSatisfaction, pressureIndex, climateState } from '../domain/consequences'
import { BARRA_STAGES, BARRA_LABELS, shiftBarra, nextBarraStage, barraWeeklyEffect, auditChance, scandalOutcome } from '../domain/barra'
import { BARRA_EVENTS, EMERGENCY_MEETING, BOARD_FAVOR_DUE } from '../domain/climateEvents'
import { shouldReactivateWarnings } from '../domain/warnings'
import { seasonYearOf, weekOfDate } from '../domain/gameWeek'
import { wageInequities, benchComplainers, trainingLoad } from '../domain/squadConsequences'
import { detectCombos } from '../domain/combos'
import { ensureCharacters, rememberBarraVisit, adjustGrudge } from '../domain/characters'
import { countBySource } from '../domain/seasonStory'
import { signingsSummary, decisionRanking } from '../domain/yearInReview'
import { stepArcs, chapterTemplate, resolveChapter, parseArcCode, normalizeArcs } from '../domain/arcs'
import { arcById } from '../domain/arcCatalog'
import { isPreseason, preseasonEvent, resolveFriendlyGamble, PRESEASON_EVENT_WEEKS } from '../domain/preseason'

const sign = (n) => (n > 0 ? `+${n}` : String(n))

/**
 * Clima del club: aplica consecuencias a los tres medidores (hinchada, dirigencia, vestuario) y las deja
 * registradas en la bitácora para mostrarlas como "Esto pasó por tu decisión".
 * Hinchada y dirigencia se escriben en `clubs`; los triggers de la base mantienen sus tablas de detalle.
 */
export const climateApi = {
  difficulty: DIFFICULTY.NORMAL,

  /** Fija la dificultad en uso (se carga al entrar al juego y al cambiarla en el selector) */
  setDifficulty(key) {
    this.difficulty = DIFFICULTY[key] || DIFFICULTY.NORMAL
    return this.difficulty
  },

  /** Guarda la dificultad elegida para el club y la aplica ya mismo */
  async saveDifficulty(clubId, key) {
    this.setDifficulty(key)
    await this.saveState(clubId, { difficulty: this.difficulty.key })
    queryCache.invalidate(`climate:${clubId}`)
    return this.difficulty
  },

  /** Silencia un tipo de aviso para este club (se reactiva solo tras un escándalo o 5 victorias seguidas) */
  async muteWarning(clubId, key) {
    const state = await this.getState(clubId)
    await this.saveState(clubId, { muted_warnings: { ...(state.muted_warnings || {}), [key]: true } })
    queryCache.invalidate(`climate:${clubId}`)
  },

  /** Carga el estado del club y deja puesta su dificultad */
  async load(clubId) {
    const state = await queryCache.fetch(`climate:${clubId}`, () => this.getState(clubId), 30000)
    return state
  },

  /** Suma deltas a los medidores del club (con tope 0-100) y devuelve los valores nuevos */
  async applyDeltas(clubId, { fans = 0, board = 0, locker = 0 }) {
    if (!fans && !board && !locker) return null
    const { data: club } = await supabase
      .from('clubs')
      .select('fans_confidence, squad_morale')
      .eq('id', clubId)
      .single()
    if (!club) return null

    const updates = {}
    if (fans) updates.fans_confidence = clamp((club.fans_confidence ?? 65) + fans)
    if (locker) updates.squad_morale = clamp((club.squad_morale ?? 60) + locker)

    // La confianza de la dirigencia se recalcula desde sus tres satisfacciones (deportiva pesa 50%):
    // por eso un cambio en la confianza global se aplica a la satisfacción deportiva, al doble
    if (board) {
      const { data: row } = await supabase
        .from('club_board_confidence')
        .select('sports_satisfaction, financial_satisfaction, squad_satisfaction')
        .eq('club_id', clubId)
        .maybeSingle()
      if (row) {
        const sports = clamp((row.sports_satisfaction ?? 70) + board * 2)
        const global = Math.round(sports * 0.5 + (row.financial_satisfaction ?? 70) * 0.3 + (row.squad_satisfaction ?? 70) * 0.2)
        await supabase.from('club_board_confidence').update({ sports_satisfaction: sports, confidence_score: global, updated_at: new Date().toISOString() }).eq('club_id', clubId)
      } else {
        const { data: c } = await supabase.from('clubs').select('board_confidence').eq('id', clubId).single()
        updates.board_confidence = clamp((c?.board_confidence ?? 70) + board)
      }
    }

    if (Object.keys(updates).length) {
      const { error } = await supabase.from('clubs').update(updates).eq('id', clubId)
      if (error) throw new Error(error.message)
    }
    queryCache.invalidate(`club:${clubId}`)
    queryCache.invalidate(`board:${clubId}`)
    return updates
  },

  async log(clubId, gameDate, source, message, deltas) {
    const { error } = await supabase.from('consequence_log').insert({
      club_id: clubId,
      season_year: gameDate ? seasonYearOf(gameDate) : 2026,
      week_number: gameDate ? weekOfDate(gameDate) : 1,
      source,
      message,
      fans: deltas.fans || 0,
      board: deltas.board || 0,
      locker: deltas.locker || 0
    })
    if (error) console.warn('Aviso: no se pudo registrar la consecuencia:', error.message)
  },

  /** Consecuencias de un partido jugado (rachas, goleadas, clásico, hinchada de visitante) */
  async applyMatchConsequences({ clubId, fixtureId = null, result, gameDate = null }) {
    const outcome = result.isHome
      ? (result.homeScore > result.awayScore ? 'W' : result.homeScore < result.awayScore ? 'L' : 'D')
      : (result.awayScore > result.homeScore ? 'W' : result.awayScore < result.homeScore ? 'L' : 'D')
    const goalDiff = result.isHome ? result.homeScore - result.awayScore : result.awayScore - result.homeScore

    // El partido ya está guardado como jugado cuando llega acá; si no lo está, se suma a mano
    const streakData = await moraleApi.getStreaks(clubId)
    let results = streakData.results
    if (!fixtureId || !streakData.fixtureIds.includes(fixtureId)) results = [...results, outcome]
    const win = [...results].reverse().findIndex(r => r !== 'W')
    const loss = [...results].reverse().findIndex(r => r !== 'L')
    const streaks = { win: win === -1 ? results.length : win, loss: loss === -1 ? results.length : loss }

    const effects = matchConsequences({ result: outcome, isHome: result.isHome, isDerby: result.isDerby, goalDiff, streaks }, this.difficulty)
    await this.applyDeltas(clubId, effects)

    const parts = []
    if (effects.fans) parts.push(`hinchada ${sign(effects.fans)}`)
    if (effects.board) parts.push(`dirigencia ${sign(effects.board)}`)
    if (effects.locker) parts.push(`vestuario ${sign(effects.locker)}`)
    const message = [...effects.notes, parts.length ? `(${parts.join(', ')})` : ''].filter(Boolean).join(' ')
    if (effects.notes.length || effects.fans || effects.board) {
      await this.log(clubId, gameDate, 'MATCH', message || 'Resultado del partido', effects)
    }
    return effects
  },

  /**
   * Cierre semanal del clima: el humor por el precio de la entrada y la satisfacción financiera y de plantel
   * de la dirigencia (que hasta ahora quedaban clavadas en 70).
   */
  async processWeek({ clubId, gameDate = null }) {
    const { financesApi } = await import('./finances')

    // Todo lo que se lee es independiente: una sola ronda de consultas
    const { trainingApi } = await import('./training')
    const [clubRes, streaks, finances, boardRes, playersRes, recentIntensities] = await Promise.all([
      supabase.from('clubs').select('budget, ticket_price, wage_budget, squad_morale').eq('id', clubId).single(),
      moraleApi.getStreaks(clubId),
      financesApi.getFinances(clubId),
      supabase.from('club_board_confidence').select('sports_satisfaction').eq('club_id', clubId).maybeSingle(),
      supabase.from('players').select('id, attr_overall, contract_salary, state_morale, is_injured').eq('club_id', clubId).eq('is_retired', false),
      trainingApi.getRecentIntensities(clubId).catch(() => [])
    ])
    const club = clubRes.data
    if (!club) return null

    const mood = ticketPriceMood({ price: Number(club.ticket_price || 10), streaks }, this.difficulty)
    const financial = financialSatisfaction({
      balance: finances.balance,
      expectedWeeklyFlow: finances.expectedWeeklyFlow,
      wageOverBudget: finances.wageOverBudget
    })
    const squad = clamp(Math.round(club.squad_morale ?? 60))
    const row = boardRes.data

    // Las escrituras tocan filas distintas (hinchada del club, satisfacción de la dirigencia, moral de los jugadores): van juntas
    await Promise.all([
      (async () => {
        if (mood.fans) {
          await this.applyDeltas(clubId, { fans: mood.fans })
          await this.log(clubId, gameDate, 'TICKET_PRICE', `${mood.note} (hinchada ${sign(mood.fans)})`, { fans: mood.fans })
        }
        // Combos y círculos viciosos: en la misma rama que el humor por el precio, para no pisarse al escribir el club
        const trainingHighWeeks = recentIntensities.length
          ? trainingLoad({ recent: recentIntensities.slice(1), current: recentIntensities[0] }).consecutiveHigh
          : 0
        const combos = detectCombos({
          price: Number(club.ticket_price || 10),
          streaks,
          trainingHighWeeks,
          injuredCount: (playersRes.data || []).filter(p => p.is_injured).length
        }, this.difficulty)
        for (const combo of combos) {
          await this.applySquadConsequence({ clubId, source: 'COMBO', gameDate, effects: { ...combo.effects, notes: [`${combo.label}. ${combo.note}`] } })
        }
      })(),
      (async () => {
        if (!row) return
        const global = Math.round((row.sports_satisfaction ?? 70) * 0.5 + financial * 0.3 + squad * 0.2)
        await supabase.from('club_board_confidence').update({
          financial_satisfaction: financial,
          squad_satisfaction: squad,
          confidence_score: global,
          updated_at: new Date().toISOString()
        }).eq('club_id', clubId)
        queryCache.invalidate(`board:${clubId}`)
      })(),
      this.applyWageInequity({ clubId, gameDate, players: playersRes.data || [] }).catch((e) => {
        console.warn('Aviso: no se pudo evaluar la inequidad salarial:', e)
      }),
      this.applyBenchComplaints({ clubId, gameDate, players: playersRes.data || [], fixtureIds: streaks.fixtureIds || [] }).catch((e) => {
        console.warn('Aviso: no se pudieron evaluar los reclamos de suplentes:', e)
      })
    ])
    return { mood, financial, squad }
  },

  /** Aplica y registra el efecto de una decisión sobre el plantel (`effects`: { fans, board, locker, notes }) */
  async applySquadConsequence({ clubId, source, gameDate = null, effects }) {
    if (!effects || (!effects.fans && !effects.board && !effects.locker)) return null
    await this.applyDeltas(clubId, effects)
    const parts = []
    if (effects.fans) parts.push(`hinchada ${sign(effects.fans)}`)
    if (effects.board) parts.push(`dirigencia ${sign(effects.board)}`)
    if (effects.locker) parts.push(`vestuario ${sign(effects.locker)}`)
    await this.log(clubId, gameDate, source, `${(effects.notes || []).join(' ')} (${parts.join(', ')})`.trim(), effects)
    return effects
  },

  /** Reclamo por sueldos desparejos: los que cobran 25% menos que un par de su nivel se enojan (-2 de moral) */
  async applyWageInequity({ clubId, gameDate = null, players: knownPlayers = null }) {
    // Si quien llama ya leyó los jugadores (en la misma ronda que el resto), no se piden otra vez
    const players = knownPlayers || (await supabase
      .from('players')
      .select('id, attr_overall, contract_salary, state_morale')
      .eq('club_id', clubId)
      .eq('is_retired', false)).data
    const aggrieved = wageInequities(players || [])
    if (!aggrieved.length) return 0
    const byId = new Map(players.map(p => [p.id, p]))
    const { playerApi } = await import('./player')
    await Promise.all([
      playerApi.batchUpdate(aggrieved.map(id => ({ id, state_morale: clamp((byId.get(id).state_morale ?? 70) - 2, 10) }))),
      this.log(clubId, gameDate, 'WAGES', `${aggrieved.length} jugador(es) se quejan de cobrar bastante menos que compañeros de su nivel (moral -2).`, {})
    ])
    return aggrieved.length
  },

  /** Ajusta el rencor del periodista (positivo si le diste la espalda, negativo si diste la cara) y lo guarda */
  async adjustJournalistGrudge(clubId, delta) {
    const state = await this.getState(clubId)
    const characters = adjustGrudge(ensureCharacters(state.characters, clubId), delta)
    await this.saveState(clubId, { characters })
    queryCache.invalidate(`climate:${clubId}`)
    return characters.journalist.grudge
  },

  /** Suplentes sin minutos en los últimos partidos: reclaman y pierden moral (-3) */
  async applyBenchComplaints({ clubId, gameDate = null, players = [], fixtureIds = [] }) {
    const recent = fixtureIds.slice(-4)
    if (recent.length < 4 || !players.length) return 0
    const { data: stats } = await supabase.from('player_match_stats').select('player_id').eq('club_id', clubId).in('fixture_id', recent)
    const complaining = benchComplainers({ players, playedIds: (stats || []).map(s => s.player_id), games: recent.length })
    if (!complaining.length) return 0
    const byId = new Map(players.map(p => [p.id, p]))
    const { playerApi } = await import('./player')
    await Promise.all([
      playerApi.batchUpdate(complaining.map(id => ({ id, state_morale: clamp((byId.get(id).state_morale ?? 70) - 3, 10) }))),
      this.log(clubId, gameDate, 'BENCH_MINUTES', `${complaining.length} suplente(s) reclaman minutos: hace cuatro partidos que no juegan (moral -3).`, {})
    ])
    return complaining.length
  },

  /** ¿Es el jugador el ídolo del club o su capitán? (para avisar antes de venderlo) */
  async getReferentFlags(clubId, playerId) {
    const [{ data: player }, { data: locker }] = await Promise.all([
      supabase.from('players').select('is_idol').eq('id', playerId).maybeSingle(),
      supabase.from('club_locker_room').select('captain_player_id').eq('club_id', clubId).maybeSingle()
    ])
    return { isIdol: Boolean(player?.is_idol), isCaptain: locker?.captain_player_id === playerId }
  },

  /** Estado del clima del club (valores por defecto si todavía no hay fila) */
  async getState(clubId) {
    const { data } = await supabase.from('club_climate').select('*').eq('club_id', clubId).maybeSingle()
    return data || { club_id: clubId, pressure: 0, climate: 'FLOWS', barra_stage: 'CALM', favors: 0, scandals: 0, suspended_matches: 0, board_owed: 0, difficulty: 'NORMAL', muted_warnings: {}, characters: {}, arcs: {} }
  },

  async saveState(clubId, patch) {
    const { error } = await supabase.from('club_climate').upsert({ club_id: clubId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'club_id' })
    if (error) console.warn('Aviso: no se pudo guardar el clima del club:', error.message)
  },

  /**
   * Cierre semanal del clima: calcula la presión, mueve la barra, cobra sus efectos en el vestuario, sortea la auditoría
   * si hay favores aceptados y dispara los eventos que corresponden (pedido de la barra, reunión de emergencia, favor de la dirigencia).
   */
  async advanceWeek({ clubId, managerId = null, careerId = null, week = 1, gameDate = null }) {
    // Cuatro lecturas independientes: una sola ronda de consultas
    const [state, clubRes, boardRes, streaks, pendingEvents, firstFixture] = await Promise.all([
      this.getState(clubId),
      supabase.from('clubs').select('fans_confidence, budget').eq('id', clubId).single(),
      supabase.from('club_board_confidence').select('sports_satisfaction, confidence_score').eq('club_id', clubId).maybeSingle(),
      moraleApi.getStreaks(clubId),
      import('./events').then(({ eventsApi }) => eventsApi.getPendingEvents(clubId)).catch(() => []),
      // El amistoso solo llega en semanas puntuales de la pretemporada
      PRESEASON_EVENT_WEEKS.includes(week) ? import('./finances').then(({ financesApi }) => financesApi.firstFixtureDate(clubId)).catch(() => null) : Promise.resolve(null)
    ])
    this.setDifficulty(state.difficulty)
    const club = clubRes.data
    if (!club) return null
    const board = boardRes.data

    const objectiveGap = clamp((65 - (board?.sports_satisfaction ?? 70)) / 65, 0, 1)
    const pressure = pressureIndex({
      lossStreak: streaks.loss,
      winlessStreak: streaks.winless,
      objectiveGap,
      fans: club.fans_confidence ?? 65,
      balance: Number(club.budget || 0),
      openScandals: state.scandals
    })
    const climate = climateState(pressure).key

    const previousStage = state.barra_stage
    const stage = nextBarraStage({ stage: previousStage, climate, recentWin: streaks.win >= 1 }, this.difficulty)

    const patch = { pressure, climate, barra_stage: stage }

    // El efecto de la barra sobre el vestuario no depende de la auditoría: arranca ya y se espera al final
    const weekly = barraWeeklyEffect(stage, this.difficulty)
    const weeklyEffect = weekly.locker
      ? this.applySquadConsequence({ clubId, source: 'BARRA', gameDate, effects: { locker: weekly.locker, notes: [`La barra está en "${BARRA_LABELS[stage].toLowerCase()}" y el vestuario lo siente.`] } })
      : Promise.resolve()
    weeklyEffect.catch(() => {}) // si algo falla antes de esperarlo, no queda un rechazo sin atender

    // Auditoría: cuantos más favores aceptaste, más cerca está de aparecer
    let dismissed = false
    if (state.favors > 0 && Math.random() < auditChance(state.favors)) {
      const scandals = (state.scandals || 0) + 1
      const outcome = scandalOutcome(scandals)
      patch.scandals = scandals
      patch.suspended_matches = (state.suspended_matches || 0) + outcome.suspendMatches
      if (outcome.fine) {
        const { financesApi } = await import('./finances')
        await financesApi.moveCash({ clubId, careerId, category: 'FINE', amount: -outcome.fine, description: 'Multa por irregularidades detectadas en una auditoría', allowNegative: true })
      }
      await this.applySquadConsequence({ clubId, source: 'AUDIT', gameDate, effects: { board: outcome.board, notes: [outcome.note] } })
      if (managerId && outcome.reputation) {
        try {
          const { reputationApi } = await import('./reputation')
          await reputationApi.applyReputationDelta({ managerId, eventType: 'MATCH_RESULT', sourceEntityId: `audit_${clubId}_${scandals}`, delta: outcome.reputation, description: 'Auditoría con irregularidades' })
        } catch (e) {
          console.warn('Aviso: no se pudo aplicar la reputación del escándalo:', e)
        }
      }
      if (outcome.dismissal) {
        const { boardApi } = await import('./board')
        await boardApi.executeManagerDismissal(clubId, managerId, 'CORRUPTION_SCANDAL', board?.confidence_score ?? 15)
        dismissed = true
      }
    }

    // Los avisos silenciados vuelven tras un escándalo o una racha de 5 victorias: "hace rato que no te avisamos"
    if (Object.keys(state.muted_warnings || {}).length && shouldReactivateWarnings({ previousScandals: state.scandals || 0, scandals: patch.scandals ?? state.scandals ?? 0, winStreak: streaks.win })) {
      patch.muted_warnings = {}
    }

    // Guardar el estado, el efecto de la barra y la creación de eventos no dependen entre sí
    // Personajes del club: se sortean la primera vez y la barra recuerda cuántas veces vino
    let characters = ensureCharacters(state.characters, clubId)
    const eventTemplates = []
    if (!dismissed) {
      if (BARRA_STAGES.indexOf(stage) > BARRA_STAGES.indexOf(previousStage) && stage !== 'CALM') {
        const visit = rememberBarraVisit(characters)
        characters = visit.characters
        eventTemplates.push({ template: BARRA_EVENTS[stage], memory: visit.memory })
      }
      if (stage === 'INVASION' && (board?.confidence_score ?? 70) < 40) eventTemplates.push({ template: EMERGENCY_MEETING })
      if (state.board_owed > 0 && climate !== 'FLOWS' && Math.random() < 0.5) eventTemplates.push({ template: BOARD_FAVOR_DUE })
    }
    patch.characters = characters

    // Pretemporada: amistosos con riesgo y recompensa (semanas 2 y 4, antes del primer partido)
    if (!dismissed && gameDate && isPreseason(gameDate, firstFixture)) {
      const friendly = preseasonEvent(week)
      if (friendly) eventTemplates.push({ template: friendly })
    }

    // Historias de varias fechas: una a la vez, con un capítulo cada tanto
    let storyLog = null
    if (!dismissed) {
      const step = stepArcs({
        arcs: state.arcs,
        climate,
        week,
        pendingEvents: (pendingEvents || []).length + eventTemplates.length,
        chapterPending: (pendingEvents || []).some(p => parseArcCode(p.template_code))
      })
      patch.arcs = step.arcs
      if (step.deliver) {
        eventTemplates.push({ template: chapterTemplate(step.deliver.arcId, step.deliver.index, step.deliver.flags, characters) })
        if (step.started) storyLog = `Empieza una historia: ${arcById(step.deliver.arcId).title}. ${arcById(step.deliver.arcId).tagline}`
      }
    }
    const { eventsApi } = eventTemplates.length ? await import('./events') : { eventsApi: null }
    const [, , , ...createdFlags] = await Promise.all([
      this.saveState(clubId, patch),
      weeklyEffect,
      storyLog ? this.log(clubId, gameDate, 'ARC', storyLog, {}) : Promise.resolve(),
      ...eventTemplates.map(({ template, memory }) => eventsApi.createFromTemplate(template, { clubId, managerId, careerId, week, characters, memory }))
    ])
    const created = createdFlags

    queryCache.invalidate(`climate:${clubId}`)
    return { pressure, climate, stage, scandals: patch.scandals ?? state.scandals, dismissed, events: created.filter(Boolean).length }
  },

  /**
   * Aplica los efectos de la opción elegida en un evento: medidores, barra, favores, deuda con la dirigencia y
   * acciones especiales (denuncia, renuncia, apuesta de despido). Devuelve un texto con lo que pasó, si corresponde.
   */
  async applyEventEffects({ clubId, managerId = null, effects = {}, title = 'Evento', gameDate = null }) {
    await this.applySquadConsequence({
      clubId,
      source: 'EVENT',
      gameDate,
      effects: { fans: effects.fans || 0, board: effects.board || 0, locker: effects.locker ?? effects.locker_room ?? 0, notes: [`${title}.`] }
    })

    const state = await this.getState(clubId)
    const patch = {}
    if (effects.barra) patch.barra_stage = shiftBarra(state.barra_stage, effects.barra)
    if (effects.favors) patch.favors = Math.max(0, (state.favors || 0) + effects.favors)
    if (effects.board_owed) patch.board_owed = Math.max(0, (state.board_owed || 0) + effects.board_owed)
    if (Object.keys(patch).length) await this.saveState(clubId, patch)

    if (effects.board_set != null) {
      const { data: row } = await supabase.from('club_board_confidence').select('financial_satisfaction, squad_satisfaction').eq('club_id', clubId).maybeSingle()
      if (row) {
        let financial = row.financial_satisfaction ?? 70
        let squad = row.squad_satisfaction ?? 70
        let sports = Math.round((effects.board_set - financial * 0.3 - squad * 0.2) / 0.5)
        if (sports < 0) {
          // Con la satisfacción deportiva en cero no alcanza para bajar tanto: también cae la financiera y la de plantel
          sports = 0
          financial = squad = clamp(effects.board_set * 2)
        }
        sports = clamp(sports)
        const global = Math.round(sports * 0.5 + financial * 0.3 + squad * 0.2)
        await supabase.from('club_board_confidence').update({
          sports_satisfaction: sports,
          financial_satisfaction: financial,
          squad_satisfaction: squad,
          confidence_score: global,
          updated_at: new Date().toISOString()
        }).eq('club_id', clubId)
      }
    }

    if (effects.action === 'RESIGN' && managerId) {
      const { careerApi } = await import('./career')
      await careerApi.resignFromClub(managerId, clubId)
      return 'Renunciaste al cargo. El club sigue sin vos.'
    }
    if (effects.action === 'GAMBLE_DISMISSAL') {
      if (Math.random() < 0.5) {
        const { boardApi } = await import('./board')
        await boardApi.executeManagerDismissal(clubId, managerId, 'BARRA_PRESSURE', 15)
        return 'La dirigencia decidió que te vas. La reunión terminó sin saludos.'
      }
      await supabase.from('club_board_confidence').update({
        is_under_ultimatum: true,
        ultimatum_points_required: 4,
        ultimatum_matches_remaining: 3,
        ultimatum_points_gathered: 0,
        updated_at: new Date().toISOString()
      }).eq('club_id', clubId)
      return 'La dirigencia te bancó, pero con plazo: 4 puntos en los próximos 3 partidos.'
    }
    // Amistoso de pretemporada con apuesta: la suerte se tira al resolver y el resultado queda en la bitácora
    if (effects.gamble) {
      const { effects: result, note } = resolveFriendlyGamble(effects.gamble)
      await this.applySquadConsequence({ clubId, source: 'EVENT', gameDate, effects: { ...result, notes: [note] } })
      queryCache.invalidate(`climate:${clubId}`)
      return note
    }
    // Pedido de salida con ruido: el aumento o el malestar del jugador los aplica la base
    if (effects.player_id && (effects.action === 'RAISE_WAGE' || effects.action === 'PLAYER_UNHAPPY')) {
      const { data, error } = await supabase.rpc('apply_player_drama', {
        p_club_id: clubId, p_player_id: effects.player_id, p_action: effects.action === 'RAISE_WAGE' ? 'RAISE_WAGE' : 'UNHAPPY'
      })
      queryCache.invalidate('squad:')
      queryCache.invalidate('finances:')
      queryCache.invalidate(`climate:${clubId}`)
      if (error) {
        console.warn('Aviso: no se pudo aplicar lo del jugador:', error.message)
        return null
      }
      if (data?.status === 'RAISED') return `Le subiste el sueldo: de $${Number(data.previous_wage).toLocaleString('es-AR')} a $${Number(data.wage).toLocaleString('es-AR')} por semana.`
      if (data?.status === 'UNHAPPY') return 'El jugador no lo tomó bien: anda con la cabeza en otro lado.'
      return null
    }
    queryCache.invalidate(`climate:${clubId}`)
    return null
  },

  /**
   * Un capítulo de una historia se resolvió: guarda la marca de la opción y prepara el siguiente capítulo.
   * Al terminar la historia deja su desenlace en la bitácora (y en el resumen de la temporada).
   */
  async onArcChapterResolved({ clubId, code, optionId, gameDate = null }) {
    if (!parseArcCode(code)) return null
    const state = await this.getState(clubId)
    const { arcs, finished } = resolveChapter(state.arcs, code, optionId, gameDate ? seasonYearOf(gameDate) : null)
    await this.saveState(clubId, { arcs })
    if (finished) await this.log(clubId, gameDate, 'ARC', `Historia cerrada, ${finished.title}: ${finished.ending}`, {})
    queryCache.invalidate(`climate:${clubId}`)
    return finished
  },

  /** Datos para el resumen de la temporada: el estado del clima y cuántas consecuencias hubo de cada tipo */
  async getSeasonSummaryData(clubId, seasonYear) {
    const [state, { data: logs }, { data: transfers }] = await Promise.all([
      this.getState(clubId),
      supabase.from('consequence_log').select('source, message, fans, board, locker').eq('club_id', clubId).eq('season_year', seasonYear),
      supabase.from('transfer_audit_log').select('player_id, from_club_id, to_club_id, transfer_fee')
        .eq('season_year', seasonYear).or(`from_club_id.eq.${clubId},to_club_id.eq.${clubId}`)
    ])
    // Historias que se cerraron este año (las que no tienen año, de carreras viejas, no se cuentan)
    const arcsClosed = normalizeArcs(state.arcs).done.filter(d => d.season === seasonYear)
    return {
      state,
      counts: countBySource(logs || []),
      arcsClosed,
      signings: signingsSummary(transfers || [], clubId),
      decisions: decisionRanking(logs || [])
    }
  },

  /** Últimas consecuencias registradas del club */
  async getRecent(clubId, limit = 10) {
    const { data } = await supabase
      .from('consequence_log')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  }
}
