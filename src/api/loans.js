import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

/**
 * Cesiones a préstamo. Las reglas (máximo de 3 cedidos, plantel mínimo de 16) y el sorteo del club receptor los resuelve la base;
 * acá solo se pide y se muestra. El cedido sale del plantel (y de la masa salarial) y vuelve al cerrar la temporada.
 */
export const loansApi = {
  async loanOut(clubId, playerId) {
    const { data, error } = await supabase.rpc('loan_out_player', { p_club_id: clubId, p_player_id: playerId })
    if (error) throw new Error(error.message)
    queryCache.invalidate(`squad:${clubId}`)
    queryCache.invalidate(`finances:${clubId}`)
    return { borrowerName: data?.borrower_name || 'otro club', wageSaved: Number(data?.wage_saved || 0) }
  },

  /** Devuelve al club a todos sus cedidos (lo llama el cierre de temporada); trae cuántos volvieron */
  async returnLoans(clubId) {
    const { data, error } = await supabase.rpc('return_loans', { p_club_id: clubId })
    if (error) throw new Error(error.message)
    queryCache.invalidate(`squad:${clubId}`)
    return Number(data || 0)
  },

  /** Jugadores del club que están a préstamo en otro club y lo que se ahorra por semana en sueldos */
  async getLoans(clubId) {
    if (!clubId) return { players: [], weeklySaving: 0 }
    const { data } = await supabase
      .from('players')
      .select('id, first_name, last_name, position, contract_salary, clubs:club_id(name)')
      .eq('loan_from_club_id', clubId)
      .order('last_name')
    const players = data || []
    return { players, weeklySaving: players.reduce((t, p) => t + Number(p.contract_salary || 0), 0) }
  }
}
