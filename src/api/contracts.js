import { supabase } from './supabase'
import { queryCache } from '../utils/cache'
import { auditApi } from './audit'

export const contractApi = {
  async renewContract(playerId, newTerms) {
    // newTerms: { contract_salary, contract_end, contract_role }
    const { data, error } = await supabase
      .from('players')
      .update(newTerms)
      .eq('id', playerId)
      .select()
      .single()
      
    if (error) throw new Error(error.message)
    queryCache.invalidate('squad:')
    queryCache.invalidate('offers:')
    return data
  },
  
  async getOffersForClub(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`offers:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*, players(*)')
        .eq('to_club_id', clubId)
        .eq('status', 'PENDING')
        
      if (error) throw new Error(error.message)
      return data || []
    }, 45000)
  },
  
  async resolveOffer(offerId, status, playerId, fromClubId, toClubId, offerAmount, managerId) {

    // status: 'ACCEPTED' or 'REJECTED'
    const { error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', offerId)
      
    if (error) throw new Error(error.message)
    
    if (status === 'ACCEPTED') {
      const { data: player } = await supabase.from('players').select('club_id').eq('id', playerId).single()
      const { data: toClub } = await supabase.from('clubs').select('budget').eq('id', toClubId).single()
      
      const newBudget = toClub.budget + offerAmount

      // Sumar dinero al club vendedor
      await supabase.from('clubs').update({ budget: newBudget }).eq('id', toClubId)
      
      // Restar al club comprador (si no es NULL)
      if (fromClubId) {
        const { data: fromClub } = await supabase.from('clubs').select('budget').eq('id', fromClubId).single()
        await supabase.from('clubs').update({ budget: fromClub.budget - offerAmount }).eq('id', fromClubId)
      }

      // Mover jugador
      await supabase.from('players').update({ club_id: fromClubId, is_transfer_listed: false }).eq('id', playerId)

      if (managerId) {
        await auditApi.logAction({
          whoId: managerId,
          action: 'SELL_PLAYER',
          entityType: 'player',
          entityId: playerId,
          stateBefore: { club_id: toClubId, budget: toClub.budget },
          stateAfter: { club_id: fromClubId, budget: newBudget, amount: offerAmount }
        })
      }
    }

    queryCache.invalidate('squad:')
    queryCache.invalidate('offers:')
    queryCache.invalidate('finances:')
    queryCache.invalidate('club:')
  },

  async generateRandomOffersForWeek(clubId, players, isMarketOpen) {
    if (!players || players.length === 0 || !isMarketOpen) return
    
    // Obtener un bot aleatorio como comprador
    const { data: bots } = await supabase.from('clubs').select('id, budget').eq('history_type', 'bot').limit(10)
    if (!bots || bots.length === 0) return

    for (const player of players) {
      // Base chance 2%. If transfer listed, 30% chance.
      const chance = player.is_transfer_listed ? 0.3 : 0.02
      if (Math.random() < chance) {
        const buyer = bots[Math.floor(Math.random() * bots.length)]
        
        // Oferta fluctúa entre 80% y 120% del valor
        const factor = 0.8 + (Math.random() * 0.4)
        const offerAmount = Math.round(player.market_value * factor)
        
        if (buyer.budget >= offerAmount) {
          const newOffer = {
            player_id: player.id,
            from_club_id: buyer.id,
            to_club_id: clubId,
            amount: offerAmount,
            status: 'PENDING'
          }
          await supabase.from('offers').insert(newOffer)
        }
      }
    }
  }
}
