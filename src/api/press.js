import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const MEDIA_OUTLETS = [
  { name: 'FM El Aguante 91.5', journalist: 'Horacio "El Turco" Méndez', tier: 5 },
  { name: 'Diario Deportivo El Potrero', journalist: 'Esteban Valenzuela', tier: 5 },
  { name: 'Crónica Barrial', journalist: 'Lorena Benítez', tier: 5 },
  { name: 'La Oral del Ascenso', journalist: 'Gustavo Paenza', tier: 5 },
  { name: 'Cadena Deportiva Sur', journalist: 'Ramiro Carrizo', tier: 4 }
]

export const pressApi = {
  /**
   * Genera o recupera la conferencia de prensa post-partido
   */
  async generatePostMatchConference({
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

  /**
   * Responde a una pregunta de la rueda de prensa
   */
  async submitAnswer({ conferenceId, questionId, chosenTone, answerText, moraleImpact = 0, clubId, managerId }) {
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

    // 2. Aplicar impacto en moral a nivel plantel
    if (clubId && moraleImpact !== 0) {
      const { data: players } = await supabase
        .from('players')
        .select('id, morale')
        .eq('club_id', clubId)

      if (players && players.length > 0) {
        // Ajustar moral en lote suavemente
        for (const p of players) {
          const newMorale = Math.min(100, Math.max(10, (p.morale || 70) + moraleImpact))
          await supabase.from('players').update({ morale: newMorale }).eq('id', p.id)
        }
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
      const { data: players } = await supabase.from('players').select('id, morale').eq('club_id', clubId)
      if (players) {
        for (const p of players) {
          const newMorale = Math.min(100, (p.morale || 70) + 1)
          await supabase.from('players').update({ morale: newMorale }).eq('id', p.id)
        }
      }
    }

    return { success: true }
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
