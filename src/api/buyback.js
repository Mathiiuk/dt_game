import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

/**
 * Cláusula de recompra. Al vender podés dejarla (pagás el 10% de la venta) y durante dos temporadas recomprar al jugador
 * por el 125% de lo cobrado. El cobro, el vencimiento y el traspaso de vuelta los resuelve la base.
 */
export const buybackApi = {
  async grant(clubId, playerId) {
    const { data, error } = await supabase.rpc('grant_buyback', { p_club_id: clubId, p_player_id: playerId })
    if (error) throw new Error(error.message)
    queryCache.invalidate(`finances:${clubId}`)
    queryCache.invalidate('club:')
    return { cost: Number(data?.cost || 0), price: Number(data?.price || 0), expiresSeason: Number(data?.expires_season || 0) }
  },

  async exercise(clubId, rightId) {
    const { data, error } = await supabase.rpc('exercise_buyback', { p_club_id: clubId, p_right_id: rightId })
    if (error) throw new Error(error.message)
    queryCache.invalidate(`squad:${clubId}`)
    queryCache.invalidate(`finances:${clubId}`)
    queryCache.invalidate('club:')
    return { price: Number(data?.price || 0) }
  },

  async getRights(clubId) {
    if (!clubId) return []
    const { data } = await supabase
      .from('buyback_rights')
      .select('id, price, expires_season, players:player_id(first_name, last_name, position, age)')
      .eq('club_id', clubId)
      .order('expires_season')
    return data || []
  }
}
