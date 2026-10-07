import { supabase } from './supabase'
import { answerConsequences, outcomeOf, skipPress } from '../domain/press'
import { ensureCharacters, rumorBoost } from '../domain/characters'
import { climateApi } from './climate'
import { seasonYearOf, weekOfDate } from '../domain/gameWeek'
import { bingoCard, bingoLines, markCliche } from '../domain/pressRoom'

export const MEDIA_OUTLETS = [
  { name: 'FM El Aguante 91.5', journalist: 'Horacio "El Turco" Méndez', tier: 5 },
  { name: 'Diario Deportivo El Potrero', journalist: 'Esteban Valenzuela', tier: 5 },
  { name: 'Crónica Barrial', journalist: 'Lorena Benítez', tier: 5 },
  { name: 'La Oral del Ascenso', journalist: 'Gustavo Paenza', tier: 5 },
  { name: 'Cadena Deportiva Sur', journalist: 'Ramiro Carrizo', tier: 4 }
]

// Armados de conferencia en curso por fixture
const pressInFlight = new Map()

export const pressApi = {
  /**
   * Genera o recupera la conferencia de prensa post-partido
   */
  async generatePostMatchConference(params) {
    // Un solo armado por partido aunque la pantalla se monte dos veces (StrictMode, recarga)
    const { fixtureId } = params || {}
    if (!fixtureId) return this._generatePostMatchConference(params)

    if (!pressInFlight.has(fixtureId)) {
      const promise = this._generatePostMatchConference(params).finally(() => pressInFlight.delete(fixtureId))
      pressInFlight.set(fixtureId, promise)
    }
    return pressInFlight.get(fixtureId)
  },

  async _generatePostMatchConference({
    fixtureId = null,
    clubId,
    managerId,
    results,
    mvpPlayer = null,
    isDerby = false
  }) {
    if (!clubId) return null

    // 1. Verificar si ya existe una conferencia para este partido
    if (fixtureId) {
      const { data: existing } = await supabase
        .from('press_conferences')
        .select('*, press_qa_items(*)')
        .eq('fixture_id', fixtureId)
        .maybeSingle()

      if (existing) {
        return {
          conference: existing,
          questions: (existing.press_qa_items || []).sort((a, b) => a.order_index - b.order_index)
        }
      }
    }

    // 2. Crear sesión de conferencia
    const { data: conference, error: confErr } = await supabase
      .from('press_conferences')
      .insert({
        fixture_id: fixtureId,
        club_id: clubId,
        manager_id: managerId || null,
        status: 'IN_PROGRESS'
      })
      .select()
      .single()

    if (confErr) {
      console.warn('Error al iniciar conferencia de prensa:', confErr)
      return null
    }

    const isHome = results?.isHome ?? true
    const homeScore = results?.homeScore ?? 0
    const awayScore = results?.awayScore ?? 0
    const myScore = isHome ? homeScore : awayScore
    const rivalScore = isHome ? awayScore : homeScore
    const isWin = myScore > rivalScore
    const isDraw = myScore === rivalScore
    const opponent = results?.opponentName || 'el rival'

    const questionsList = []

    // PREGUNTA 1: Análisis general del trámite
    const outlet1 = MEDIA_OUTLETS[0]
    let q1Text = ''
    let q1Options = []

    if (isWin) {
      q1Text = `Mister, gran triunfo ${myScore}-${rivalScore} ante ${opponent}. ¿Siente que el planteo táctico superó de principio a fin al rival?`
      q1Options = [
        {
          tone: 'PRAISING',
          text: 'El mérito es 100% de los jugadores. Supieron interpretar el plan y dejaron el alma en la cancha.',
          moraleDelta: 5,
          boardReaction: 'La directiva valora tu humildad y liderazgo.'
        },
        {
          tone: 'COMBATIVE',
          text: 'Se dijeron muchas tonterías en la semana. Hoy demostramos con fútbol quién manda acá.',
          moraleDelta: 7,
          boardReaction: 'La directiva pide evitar declaraciones inflamables.'
        },
        {
          tone: 'SELF_CRITICAL',
          text: 'Ganamos, pero cometimos errores que no me gustaron nada. No podemos relajarnos ni un segundo.',
          moraleDelta: -2,
          boardReaction: 'La directiva aprueba el nivel de exigencia profesional.'
        },
        {
          tone: 'PRAGMATIC',
          text: 'Tres puntos importantísimos para la tabla. Ya pensamos en el próximo partido.',
          moraleDelta: 1,
          boardReaction: 'Declaración equilibrada y sobria.'
        }
      ]
    } else if (isDraw) {
      q1Text = `Empate con sabor agridulce ante ${opponent}. ¿Se van conformes con el punto o siente que se dejaron dos unidades en el camino?`
      q1Options = [
        {
          tone: 'COMBATIVE',
          text: 'El arbitraje nos condicionó desde el minuto uno. Era un partido ganado sin esos fallos insólitos.',
          moraleDelta: 4,
          boardReaction: 'Cuidado: la federación advierte sobre quejas arbitrales.'
        },
        {
          tone: 'SELF_CRITICAL',
          text: 'Faltó audacia en los últimos metros. Debemos ser más agresivos para definir estos partidos.',
          moraleDelta: -2,
          boardReaction: 'Directiva conforme con la autocrítica constructiva.'
        },
        {
          tone: 'PRAISING',
          text: 'Valoro la entrega física del plantel en un terreno muy complejo.',
          moraleDelta: 3,
          boardReaction: 'Respaldo dirigencial standard.'
        },
        {
          tone: 'PRAGMATIC',
          text: 'Sumar siempre sirve. La liga es larga y cada unidad cuenta al final del torneo.',
          moraleDelta: 0,
          boardReaction: 'Declaración de manual futbolero.'
        }
      ]
    } else {
      q1Text = `Dura derrota ante ${opponent}. ¿Qué explicación futbolística le encuentra al rendimiento del equipo hoy?`
      q1Options = [
        {
          tone: 'SELF_CRITICAL',
          text: 'Asumo total responsabilidad. El planteo inicial no funcionó y el rival nos superó con justicia.',
          moraleDelta: -3,
          boardReaction: 'La directiva aprecia la hidalguía para reconocer los fallos.'
        },
        {
          tone: 'COMBATIVE',
          text: 'Hubo jugadas dudosas que cambiaron el rumbo del partido. El resultado es totalmente mentiroso.',
          moraleDelta: 3,
          boardReaction: 'La comisión directiva prefiere no entrar en polémicas arbitrales.'
        },
        {
          tone: 'PRAISING',
          text: 'A pesar del marcador, vi rebeldía en varios futbolistas para no bajar los brazos.',
          moraleDelta: 2,
          boardReaction: 'El presidente espera resultados inmediatos.'
        },
        {
          tone: 'PRAGMATIC',
          text: 'Toca masticar la bronca, trabajar el doble el lunes y corregir de cara al futuro.',
          moraleDelta: 0,
          boardReaction: 'Llamado a la calma institucional.'
        }
      ]
    }

    questionsList.push({
      conference_id: conference.id,
      order_index: 1,
      journalist_name: outlet1.journalist,
      media_outlet: outlet1.name,
      topic_category: isWin ? 'STAR_PERFORMANCE' : isDraw ? 'TACTICAL_CHOICE' : 'BAD_RUN_CRISIS',
      question_text: q1Text,
      options: q1Options
    })

    // PREGUNTA 2: Figura o MVP
    const outlet2 = MEDIA_OUTLETS[1]
    const figureName = mvpPlayer?.name || 'la figura del partido'
    questionsList.push({
      conference_id: conference.id,
      order_index: 2,
      journalist_name: outlet2.journalist,
      media_outlet: outlet2.name,
      topic_category: 'STAR_PERFORMANCE',
      question_text: `Varios medios coincidieron en que ${figureName} fue decisivo. ¿Qué importancia le da a su rendimiento individual hoy?`,
      options: [
        {
          tone: 'PRAISING',
          text: `Está en un momento espectacular. Es un líder nato y contagia a todos sus compañeros dentro de la cancha.`,
          moraleDelta: 6,
          boardReaction: 'Los hinchas se ilusionan con el nivel de las figuras.'
        },
        {
          tone: 'PRAGMATIC',
          text: `Hizo un trabajo serio, pero lo que cuenta acá es la estructura colectiva del equipo.`,
          moraleDelta: 1,
          boardReaction: 'Foco en el grupo por encima de los personalismos.'
        },
        {
          tone: 'SELF_CRITICAL',
          text: `Tiene mucho talento, pero aún tiene margen para dar un 30% más si se compromete al máximo.`,
          moraleDelta: -2,
          boardReaction: 'Exigencia para mantener alta la vara.'
        },
        {
          tone: 'COMBATIVE',
          text: `Es gracioso cómo ahora lo elogian cuando hace dos semanas pedían que no juegue de titular.`,
          moraleDelta: 4,
          boardReaction: 'Tensión con los cronistas locales.'
        }
      ]
    })

    // PREGUNTA 3: Clásico o Clima del Club
    if (isDerby || Math.random() > 0.4) {
      const outlet3 = MEDIA_OUTLETS[2]
      questionsList.push({
        conference_id: conference.id,
        order_index: 3,
        journalist_name: outlet3.journalist,
        media_outlet: outlet3.name,
        topic_category: isDerby ? 'NEXT_DERBY_HYPE' : 'TACTICAL_CHOICE',
        question_text: isDerby
          ? 'Los hinchas desataron una fiesta en las tribunas por el clásico barrial. ¿Siente que este partido marca un antes y un después en el torneo?'
          : 'El vestuario parece responder a su mensaje día a día. ¿Siente el respaldo total del plantel para los desafíos que se vienen?',
        options: [
          {
            tone: 'PRAISING',
            text: 'Este grupo es una familia. La unión y el sentido de pertenencia con el club son innegociables.',
            moraleDelta: 6,
            boardReaction: 'Excelente ambiente y cohesión grupal.'
          },
          {
            tone: 'COMBATIVE',
            text: 'Nos quisieron desestabilizar desde afuera, pero este vestuario está blindado a prueba de todo.',
            moraleDelta: 5,
            boardReaction: 'Mensaje de trinchera y camaradería.'
          },
          {
            tone: 'PRAGMATIC',
            text: 'Paso a paso. El fútbol no tiene memoria y lo de hoy queda atrás a partir de mañana.',
            moraleDelta: 1,
            boardReaction: 'Prudencia valorada por la directiva.'
          },
          {
            tone: 'SELF_CRITICAL',
            text: 'El compromiso está, pero todavía nos falta madurez en pasajes claves de los partidos.',
            moraleDelta: -1,
            boardReaction: 'Autocrítica rigurosa.'
          }
        ]
      })
    }

    // Insertar preguntas en BD
    const { data: insertedQuestions, error: qaErr } = await supabase
      .from('press_qa_items')
      .insert(questionsList)
      .select()

    if (qaErr) {
      console.warn('Error insertando press_qa_items:', qaErr)
    }

    return {
      conference,
      questions: (insertedQuestions || questionsList).sort((a, b) => a.order_index - b.order_index)
    }
  },

  /** Cartilla del Bingo del DT de esta temporada: los 9 clichés y los que ya tachaste (se reinicia cada temporada) */
  async getBingo(clubId) {
    const [{ data: club }, { data: climate }] = await Promise.all([
      supabase.from('clubs').select('game_date').eq('id', clubId).maybeSingle(),
      supabase.from('club_climate').select('press_bingo').eq('club_id', clubId).maybeSingle()
    ])
    const season = club?.game_date ? seasonYearOf(club.game_date) : 2026
    const saved = climate?.press_bingo || {}
    const marks = saved.season === season ? (saved.marks || []) : []
    const card = bingoCard(`${clubId}:${season}`)
    return { season, card, marks, lines: bingoLines(card, marks).length, gameDate: club?.game_date || null }
  },

  /** Tacha un cliché de la cartilla y cobra el premio de la línea o de la cartilla llena (hinchada y dirigencia) */
  async markBingo({ clubId, cliche }) {
    const bingo = await this.getBingo(clubId)
    const marked = markCliche({ card: bingo.card, marks: bingo.marks }, cliche)
    if (!marked.changed) return { ...bingo, newLines: 0, full: false, reward: { fans: 0, board: 0 } }

    await climateApi.saveState(clubId, { press_bingo: { season: bingo.season, marks: marked.marks, lines: bingoLines(bingo.card, marked.marks).length, full: marked.full } })
    if (marked.reward.fans || marked.reward.board) {
      await climateApi.applySquadConsequence({
        clubId,
        source: 'PRESS',
        gameDate: bingo.gameDate,
        effects: {
          ...marked.reward,
          notes: [marked.full ? 'Bingo del DT: completaste la cartilla de clichés de la temporada.' : 'Bingo del DT: completaste una línea de clichés.']
        }
      })
    }
    return { ...bingo, marks: marked.marks, lines: bingoLines(bingo.card, marked.marks).length, newLines: marked.newLines, full: marked.full, reward: marked.reward }
  },

  /** "Titular o fake": acertar desmiente el rumor a tiempo (+1 dirigencia); errar deja correr el rumor (-1 hinchada) */
  async applyHeadline({ clubId, fans = 0, board = 0, gameDate = null }) {
    if (!clubId || (!fans && !board)) return null
    return climateApi.applySquadConsequence({
      clubId,
      source: 'PRESS',
      gameDate,
      effects: { fans, board, notes: [board > 0 ? 'Desmentiste un rumor a tiempo.' : 'Un rumor falso se te escapó.'] }
    })
  },

  /** "Completá la frase del DT": ±1 de hinchada según lo bien que cae la frase elegida */
  async applyPhrase({ clubId, fans = 0, gameDate = null }) {
    if (!clubId || !fans) return null
    return climateApi.applySquadConsequence({ clubId, source: 'PRESS', gameDate, effects: { fans, notes: ['La frase que elegiste en la conferencia.'] } })
  },

  /**
   * Responde a una pregunta de la rueda de prensa
   */
  async submitAnswer({ conferenceId, questionId, chosenTone, answerText, moraleImpact = 0, clubId, managerId, outcome = null, gameDate = null }) {
    if (!questionId) throw new Error('Pregunta no especificada')

    // 1. Guardar respuesta en BD
    await supabase
      .from('press_qa_items')
      .update({
        chosen_tone: chosenTone,
        manager_answer_text: answerText,
        morale_impact_applied: moraleImpact
      })
      .eq('id', questionId)

    // 2. Aplicar impacto en moral a nivel plantel (una sola llamada) y en hinchada y dirigencia según el tono
    if (clubId && moraleImpact !== 0) {
      const { data: players } = await supabase
        .from('players')
        .select('id, state_morale')
        .eq('club_id', clubId)

      if (players && players.length > 0) {
        const { playerApi } = await import('./player')
        await playerApi.batchUpdate(players.map(p => ({ id: p.id, state_morale: Math.min(100, Math.max(10, (p.state_morale ?? 70) + moraleImpact)) })))
      }
    }

    if (clubId && outcome) {
      const effects = answerConsequences({ tone: chosenTone, outcome }, climateApi.difficulty)
      if (effects.fans || effects.board) {
        await climateApi.applySquadConsequence({
          clubId,
          source: 'PRESS',
          gameDate,
          effects: { ...effects, notes: ['Tu respuesta en la conferencia de prensa.'] }
        })
      }
    }

    // 3. Verificar si quedan preguntas pendientes en esta conferencia
    const { data: pending } = await supabase
      .from('press_qa_items')
      .select('id')
      .eq('conference_id', conferenceId)
      .is('chosen_tone', null)

    const isFinished = !pending || pending.length === 0

    if (isFinished) {
      // Dar la cara aplaca al periodista (el rencor baja un punto)
      if (clubId) climateApi.adjustJournalistGrudge(clubId, -1).catch(() => {})
      await supabase
        .from('press_conferences')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        })
        .eq('id', conferenceId)

      // Registrar auditoría de prensa
      await supabase.from('press_audit_log').insert({
        manager_id: managerId || null,
        conference_id: conferenceId,
        reputation_delta: chosenTone === 'PRAISING' ? 2 : chosenTone === 'COMBATIVE' ? 1 : 0,
        board_reaction: chosenTone === 'COMBATIVE' ? 'Advertencia por declaraciones fogosas' : 'Rueda de prensa completada con éxito'
      })
    }

    return { isFinished }
  },

  /**
   * Delega la conferencia de prensa al segundo entrenador
   */
  async delegateToAssistant(conferenceId, clubId) {
    if (!conferenceId) return

    await supabase
      .from('press_conferences')
      .update({
        delegated_to_assistant: true,
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      })
      .eq('id', conferenceId)

    // Respuestas automáticas sobrias
    const { data: questions } = await supabase
      .from('press_qa_items')
      .select('*')
      .eq('conference_id', conferenceId)

    if (questions) {
      for (const q of questions) {
        await supabase
          .from('press_qa_items')
          .update({
            chosen_tone: 'PRAGMATIC',
            manager_answer_text: 'El segundo entrenador atendió a los medios con declaraciones protocolares.',
            morale_impact_applied: 1
          })
          .eq('id', q.id)
      }
    }

    // Bono atenuado suave
    if (clubId) {
      const { data: players } = await supabase.from('players').select('id, state_morale').eq('club_id', clubId)
      if (players?.length) {
        const { playerApi } = await import('./player')
        await playerApi.batchUpdate(players.map(p => ({ id: p.id, state_morale: Math.min(100, (p.state_morale ?? 70) + 1) })))
      }
    }

    return { success: true }
  },

  /**
   * El DT no se presenta a la conferencia: multa y un evento aleatorio que depende del resultado.
   * Es idempotente: si la conferencia ya se cerró, no cobra dos veces.
   */
  async skipConference({ conferenceId, clubId, managerId = null, results, gameDate = null, rng = Math.random }) {
    if (!conferenceId || !clubId) return null

    const { data: conference } = await supabase.from('press_conferences').select('status').eq('id', conferenceId).maybeSingle()
    if (conference && conference.status !== 'IN_PROGRESS') return { alreadyClosed: true }

    const outcome = outcomeOf(results)
    const mine = results.isHome ? results.homeScore : results.awayScore
    const theirs = results.isHome ? results.awayScore : results.homeScore
    const [{ data: club }, climateState] = await Promise.all([
      supabase.from('clubs').select('budget, board_confidence').eq('id', clubId).single(),
      climateApi.getState(clubId)
    ])
    // El periodista recuerda si lo dejaste plantado: con rencor, el rumor es más probable
    const characters = ensureCharacters(climateState.characters, clubId)

    const skip = skipPress({ outcome, goalDiff: mine - theirs, boardConfidence: club?.board_confidence ?? 50, rumorBoost: rumorBoost(characters) }, climateApi.difficulty, rng)
    if (skip.kind === 'RUMOR') skip.message = `${characters.journalist.name}, de ${characters.journalist.outlet}, escribió sobre tu silencio. ${skip.message}`

    await supabase
      .from('press_conferences')
      .update({ status: 'SKIPPED', completed_at: new Date().toISOString(), delegated_to_assistant: false })
      .eq('id', conferenceId)

    if (skip.fine > 0 && club) {
      const { financesApi } = await import('./finances')
      await financesApi.moveCash({ clubId, category: 'FINE', amount: -skip.fine, description: 'Multa por no presentarte a la conferencia de prensa', allowNegative: true })
    }

    await climateApi.applySquadConsequence({
      clubId,
      source: 'PRESS',
      gameDate,
      effects: { fans: skip.fans, board: skip.board, notes: [skip.message] }
    })

    await climateApi.adjustJournalistGrudge(clubId, 1)
    return { ...skip, outcome }
  },

  /**
   * Historial de ruedas de prensa completadas
   */
  async getConferenceHistory(clubId) {
    if (!clubId) return []
    const { data, error } = await supabase
      .from('press_conferences')
      .select('*, press_qa_items(*)')
      .eq('club_id', clubId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(10)

    if (error) {
      console.warn('Error consultando historial de prensa:', error)
      return []
    }
    return data || []
  }
}
