import { supabase } from './supabase'
import { FIXTURE_PLAYED_STATUSES } from '../domain/fixtureStatus'
import { resultFor, streaksFromResults, weeklyMoraleDelta } from '../domain/streaks'

// Press conference question catalog
const PRESS_CATALOG = [
  {
    id: 'PRE_MATCH_1',
    trigger: 'pre_match',
    question: '¿Cómo llega el equipo al próximo partido?',
    answers: [
      { id: 'CONFIDENT', label: 'Confiados y listos para ganar.', tone: 'POSITIVO', effects: { morale: 5, fans: 3, board: 0 } },
      { id: 'CAUTIOUS', label: 'Con respeto al rival, preparados.', tone: 'NEUTRAL', effects: { morale: 2, fans: 1, board: 2 } },
      { id: 'PRESSURE', label: 'Necesitamos los 3 puntos, la presión es alta.', tone: 'NEGATIVO', effects: { morale: -3, fans: -2, board: 5 } }
    ]
  },
  {
    id: 'POST_WIN_1',
    trigger: 'post_win',
    question: '¿Qué opina del rendimiento del equipo en la victoria?',
    answers: [
      { id: 'PRAISE', label: 'El equipo fue brillante, muy orgulloso.', tone: 'POSITIVO', effects: { morale: 8, fans: 5, board: 3 } },
      { id: 'MEASURED', label: 'Bien, pero aún hay cosas por mejorar.', tone: 'NEUTRAL', effects: { morale: 3, fans: 2, board: 2 } },
      { id: 'CREDIT_TEAM', label: 'Todo el crédito al grupo, ellos lo hicieron posible.', tone: 'POSITIVO', effects: { morale: 10, fans: 6, board: 2 } }
    ]
  },
  {
    id: 'POST_LOSS_1',
    trigger: 'post_loss',
    question: '¿Cómo procesa la derrota de hoy?',
    answers: [
      { id: 'ACCEPT', label: 'Asumo la responsabilidad. Hay que mejorar.', tone: 'NEUTRO', effects: { morale: 2, fans: 3, board: 4 } },
      { id: 'BLAME_REFS', label: 'El arbitraje nos perjudicó claramente.', tone: 'NEGATIVO', effects: { morale: -5, fans: -3, board: -5 } },
      { id: 'MOTIVATE', label: 'Este golpe nos va a fortalecer como grupo.', tone: 'POSITIVO', effects: { morale: 5, fans: 2, board: -2 } }
    ]
  },
  {
    id: 'MID_SEASON_1',
    trigger: 'weekly',
    question: '¿Qué le pide a los jugadores esta semana?',
    answers: [
      { id: 'UNITY', label: 'Unidad, trabajo en equipo ante todo.', tone: 'POSITIVO', effects: { morale: 6, fans: 2, board: 1 } },
      { id: 'RESULTS', label: 'Necesito resultados, el vestuario lo sabe.', tone: 'NEUTRAL', effects: { morale: -2, fans: 0, board: 4 } },
      { id: 'TRUST', label: 'Confío en cada uno de ellos al 100%.', tone: 'POSITIVO', effects: { morale: 8, fans: 3, board: 0 } }
    ]
  }
]

export const moraleApi = {
  // Get press conference for this week based on context
  getPressConference(context = 'weekly') {
    const options = PRESS_CATALOG.filter(q => q.trigger === context || q.trigger === 'weekly')
    return options[Math.floor(Math.random() * options.length)]
  },

  async answerPressConference(managerId, clubId, questionId, answerId) {
    const question = PRESS_CATALOG.find(q => q.id === questionId)
    if (!question) throw new Error('Invalid question')
    const answer = question.answers.find(a => a.id === answerId)
    if (!answer) throw new Error('Invalid answer')

    const { effects } = answer

    // Get current club state
    const { data: club } = await supabase
      .from('clubs')
      .select('squad_morale, fans_confidence, board_confidence')
      .eq('id', clubId)
      .single()
    
    if (!club) throw new Error('Club not found')

    // Apply effects (clamped 0-100)
    const newMorale = Math.min(100, Math.max(0, (club.squad_morale || 70) + effects.morale))
    const newFans = Math.min(100, Math.max(0, (club.fans_confidence || 75) + effects.fans))
    const newBoard = Math.min(100, Math.max(0, (club.board_confidence || 80) + effects.board))

    await supabase.from('clubs').update({
      squad_morale: newMorale,
      fans_confidence: newFans,
      board_confidence: newBoard
    }).eq('id', clubId)

    // Log press conference
    await supabase.from('press_conferences').insert({
      manager_id: managerId,
      club_id: clubId,
      question: question.question,
      answer_chosen: answer.label,
      tone: answer.tone,
      morale_effect: effects.morale,
      fans_effect: effects.fans,
      board_effect: effects.board
    })

    return { effects, newMorale, newFans, newBoard }
  },

  /** Rachas reales del club a partir de sus últimos partidos jugados */
  async getStreaks(clubId, limit = 8) {
    const { data } = await supabase
      .from('fixtures')
      .select('id, home_club_id, away_club_id, home_score, away_score, match_date')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .in('status', FIXTURE_PLAYED_STATUSES)
      .order('match_date', { ascending: false })
      .limit(limit)
    const played = (data || []).map(f => ({ id: f.id, r: resultFor(f, clubId) })).filter(x => x.r).reverse()
    const results = played.map(x => x.r)
    return { results, fixtureIds: played.map(x => x.id), ...streaksFromResults(results) }
  },

  // Cambio semanal de moral: vuelve hacia 60 y las rachas reales empujan a favor o en contra
  async processWeeklyMorale(clubId, winStreak, lossStreak) {
    if (winStreak == null || lossStreak == null) {
      const streaks = await this.getStreaks(clubId)
      winStreak = streaks.win
      lossStreak = streaks.loss
    }
    const { data: club } = await supabase
      .from('clubs')
      .select('squad_morale, squad_cohesion')
      .eq('id', clubId)
      .single()

    if (!club) return

    const moraleDelta = weeklyMoraleDelta(club.squad_morale ?? 70, { win: winStreak, loss: lossStreak })

    const newMorale = Math.min(100, Math.max(0, (club.squad_morale || 70) + moraleDelta))
    
    // Cohesion slowly trends toward morale
    const cohesionDelta = newMorale > (club.squad_cohesion || 70) ? 1 : -1
    const newCohesion = Math.min(100, Math.max(0, (club.squad_cohesion || 70) + cohesionDelta))

    await supabase.from('clubs').update({
      squad_morale: newMorale,
      squad_cohesion: newCohesion
    }).eq('id', clubId)
  },

  // Morale impact on match performance — returns a multiplier 0.85-1.15
  getMoraleMatchBoost(morale) {
    // morale 0-100 → multiplier 0.85-1.15
    return 0.85 + (morale / 100) * 0.30
  }
}
