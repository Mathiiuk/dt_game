import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { moraleApi } from './morale'
import { DIFFICULTY, clamp, matchConsequences, ticketPriceMood, financialSatisfaction } from '../domain/consequences'
import { seasonYearOf, weekOfDate } from '../domain/gameWeek'

const sign = (n) => (n > 0 ? `+${n}` : String(n))

/**
 * Clima del club: aplica consecuencias a los tres medidores (hinchada, dirigencia, vestuario) y las deja
 * registradas en la bitácora para mostrarlas como "Esto pasó por tu decisión".
 * Hinchada y dirigencia se escriben en `clubs`; los triggers de la base mantienen sus tablas de detalle.
 */
export const climateApi = {
  difficulty: DIFFICULTY.NORMAL,

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
    const { data: club } = await supabase
      .from('clubs')
      .select('budget, ticket_price, wage_budget, squad_morale')
      .eq('id', clubId)
      .single()
    if (!club) return null

    const streaks = await moraleApi.getStreaks(clubId)
    const mood = ticketPriceMood({ price: Number(club.ticket_price || 10), streaks }, this.difficulty)
    if (mood.fans) {
      await this.applyDeltas(clubId, { fans: mood.fans })
      await this.log(clubId, gameDate, 'TICKET_PRICE', `${mood.note} (hinchada ${sign(mood.fans)})`, { fans: mood.fans })
    }

    const { financesApi } = await import('./finances')
    const finances = await financesApi.getFinances(clubId)
    const financial = financialSatisfaction({
      balance: finances.balance,
      expectedWeeklyFlow: finances.expectedWeeklyFlow,
      wageOverBudget: finances.wageOverBudget
    })
    const squad = clamp(Math.round(club.squad_morale ?? 60))
    const { data: row } = await supabase.from('club_board_confidence').select('sports_satisfaction').eq('club_id', clubId).maybeSingle()
    if (row) {
      const global = Math.round((row.sports_satisfaction ?? 70) * 0.5 + financial * 0.3 + squad * 0.2)
      await supabase.from('club_board_confidence').update({
        financial_satisfaction: financial,
        squad_satisfaction: squad,
        confidence_score: global,
        updated_at: new Date().toISOString()
      }).eq('club_id', clubId)
      queryCache.invalidate(`board:${clubId}`)
    }
    return { mood, financial, squad }
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
