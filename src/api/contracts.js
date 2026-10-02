import { supabase } from './supabase'

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
    return data
  },
  
  async getOffersForClub(clubId) {
    const { data, error } = await supabase
      .from('offers')
      .select('*, players(*)')
      .eq('to_club_id', clubId)
      .eq('status', 'PENDING')
      
    if (error) throw new Error(error.message)
    return data
  },
  
  async resolveOffer(offerId, status, playerId, fromClubId) {
    // status: 'ACCEPTED' or 'REJECTED'
    const { error } = await supabase
      .from('offers')
      .update({ status })
      .eq('id', offerId)
      
    if (error) throw new Error(error.message)
    
    // Si es aceptada, transferir al jugador
    if (status === 'ACCEPTED') {
      await supabase.from('players').update({ club_id: fromClubId }).eq('id', playerId)
      // NOTA: Para un MVP esto asume que fromClubId tiene fondos, idealmente 
      // sumaríamos dinero a nuestro presupuesto aquí.
    }
  },

  // MVP: Método para generar una oferta aleatoria por uno de nuestros jugadores
  async generateRandomOffer(myClubId, myPlayers) {
    if (!myPlayers || myPlayers.length === 0) return null
    
    // 10% de chance de recibir una oferta al avanzar el tiempo o cargar dashboard
    if (Math.random() > 0.1) return null 
    
    const randomPlayer = myPlayers[Math.floor(Math.random() * myPlayers.length)]
    
    const offerAmount = (randomPlayer.attr_pace * randomPlayer.attr_shooting) * 100 // Valor ficticio
    
    const newOffer = {
      player_id: randomPlayer.id,
      to_club_id: myClubId,
      amount: offerAmount,
      status: 'PENDING'
    }
    
    const { data, error } = await supabase.from('offers').insert(newOffer).select().single()
    if (error) throw new Error(error.message)
    
    return data
  }
}
