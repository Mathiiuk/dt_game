import { supabase } from './supabase'
import { DEFAULT_RULES, normalizeRules, pickBallot, botVotes, tally, rulesFor } from '../domain/leagueRules'

/**
 * La Asamblea de la AFA: antes de cerrar la temporada los DT votan el reglamento del año siguiente.
 * El voto de tu club y el de los demás DT (los de tu liga, con su personalidad) dan un ganador, que queda guardado con sus reglas.
 */
export const leagueVoteApi = {
  /** La boleta del año (3 reglamentos) y el voto ya emitido, si lo hay */
  async getBallot(clubId, seasonYear) {
    const { data, error } = await supabase.from('season_rule_votes').select('*').eq('club_id', clubId).eq('season_year', seasonYear).maybeSingle()
    if (error) throw new Error(error.message)
    if (data) return { ballot: data.ballot, vote: data }
    return { ballot: pickBallot(`${clubId}:${seasonYear}`), vote: null }
  },

  /** Emite el voto del DT, cuenta el de los rivales (`rivals`: [{ id, name }]) y guarda el reglamento ganador */
  async castVote({ clubId, seasonYear, choice, rivals = [] }) {
    const { ballot, vote } = await this.getBallot(clubId, seasonYear)
    if (!ballot.includes(choice)) throw new Error('Esa opción no está en la boleta de la Asamblea.')
    if (vote?.winner) return { ballot, counts: tally(vote.bot_votes || [], vote.user_vote, ballot).counts, winner: vote.winner, botVotes: vote.bot_votes || [], rules: vote.rules, alreadyVoted: true }
    const bots = botVotes(`${clubId}:${seasonYear}`, rivals, ballot)
    const { counts, winner } = tally(bots, choice, ballot)
    const rules = rulesFor(winner)
    const row = { club_id: clubId, season_year: seasonYear, ballot, bot_votes: bots, user_vote: choice, winner, rules }
    const { error } = await supabase.from('season_rule_votes').upsert(row, { onConflict: 'club_id,season_year' })
    if (error) throw new Error(error.message)
    return { ballot, counts, winner, botVotes: bots, rules }
  },

  /** El reglamento que se juega ese año (el clásico si la Asamblea no votó) */
  async getRules(clubId, seasonYear) {
    if (!clubId || !seasonYear) return { ...DEFAULT_RULES }
    const { data } = await supabase.from('season_rule_votes').select('rules').eq('club_id', clubId).eq('season_year', seasonYear).maybeSingle()
    return normalizeRules(data?.rules)
  }
}
