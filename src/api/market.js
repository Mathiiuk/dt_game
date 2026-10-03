import { supabase } from './supabase'
import { clubApi } from './club'

export const marketApi = {
  // Las ventanas de mercado suelen ser Julio-Agosto y Enero.
  getMarketStatus(gameDateStr) {
    if (!gameDateStr) return { isOpen: true, name: 'Mercado Abierto' }
    const date = new Date(gameDateStr + 'T00:00:00')
    const month = date.getMonth() + 1 // 1-12
    const day = date.getDate()

    if (month === 7 || month === 8) return { isOpen: true, name: 'Mercado de Verano' }
    if (month === 1) return { isOpen: true, name: 'Mercado de Invierno' }
    return { isOpen: false, name: 'Mercado Cerrado' }
  },

  async getMarketPlayers(currentClubId, filters = {}) {
    let query = supabase
      .from('players')
      .select('*, clubs(name, short_name)')
      .neq('club_id', currentClubId)
      
    if (filters.position) query = query.eq('position', filters.position)
    if (filters.minPace) query = query.gte('attr_pace', filters.minPace)
    
    query = query.order('market_value', { ascending: false }).limit(50)

    const { data: players, error } = await query
    if (error) throw new Error(error.message)
    
    // Obtener reportes de scout para este club
    const { data: reports } = await supabase
      .from('scout_reports')
      .select('player_id, level')
      .eq('club_id', currentClubId)
      
    const reportMap = {}
    if (reports) reports.forEach(r => reportMap[r.player_id] = r.level)
    
    return players.map(p => ({
      ...p,
      scout_level: reportMap[p.id] || 0
    }))
  },

  async scoutPlayer(clubId, playerId) {
    const { error } = await supabase
      .from('scout_reports')
      .upsert({ club_id: clubId, player_id: playerId, level: 1 }, { onConflict: 'club_id,player_id' })
      
    if (error) throw new Error(error.message)
    return true
  },

  async buyPlayer(buyerClubId, playerId, offerAmount, managerId) {
    const { auditApi } = await import('./audit')

    // 1. Obtener club comprador
    const { data: buyer, error: buyerErr } = await supabase
      .from('clubs')
      .select('budget, game_date')
      .eq('id', buyerClubId)
      .single()
      
    if (buyerErr) throw new Error(buyerErr.message)

    // Validar ventana
    const marketStatus = this.getMarketStatus(buyer.game_date)
    if (!marketStatus.isOpen) {
      throw new Error('El mercado de fichajes está cerrado. Solo puedes comprar en Julio/Agosto o Enero.')
    }

    if (buyer.budget < offerAmount) throw new Error('Presupuesto insuficiente para la oferta.')
    
    // 2. Obtener jugador y club vendedor
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*, clubs(*)')
      .eq('id', playerId)
      .single()

    if (playerErr) throw new Error(playerErr.message)

    // IA Rechazo de oferta
    // Si la oferta es menor al 90% del valor de mercado, el club vendedor lo rechaza.
    const minAcceptableOffer = player.market_value * 0.9
    if (offerAmount < minAcceptableOffer) {
      throw new Error(`El ${player.clubs.name} ha rechazado la oferta por considerarla muy baja. Piden al menos $${Math.round(player.market_value).toLocaleString()}.`)
    }

    // Voluntad del jugador
    // Jugadores de gran potencial (ej: rating muy alto) pueden no querer ir a un club de menor reputación.
    // (Simplificado para MVP)

    // 3. Transferencia de fondos
    const newBuyerBudget = buyer.budget - offerAmount
    await supabase.from('clubs').update({ budget: newBuyerBudget }).eq('id', buyerClubId)

    if (player.club_id) {
       // Sumar al vendedor
       const newSellerBudget = player.clubs.budget + offerAmount
       await supabase.from('clubs').update({ budget: newSellerBudget }).eq('id', player.club_id)
    }
    
    // 4. Transferir jugador
    const { error: updatePlayerErr } = await supabase
      .from('players')
      .update({ club_id: buyerClubId })
      .eq('id', playerId)
      
    if (updatePlayerErr) throw new Error(updatePlayerErr.message)

    // 5. Audit Log
    if (managerId) {
      await auditApi.logAction({
        whoId: managerId,
        action: 'BUY_PLAYER',
        entityType: 'player',
        entityId: playerId,
        stateBefore: { club_id: player.club_id, budget: buyer.budget },
        stateAfter: { club_id: buyerClubId, budget: newBuyerBudget, amount: offerAmount }
      })
    }
    
    return true
  },

  async scoutPlayer(clubId, playerId, cost = 10000) {
    // Check budget
    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    if (!club || club.budget < cost) throw new Error('Presupuesto insuficiente para ojear')

    // Pay for scout
    await supabase.from('clubs').update({ budget: club.budget - cost }).eq('id', clubId)

    // Check if already scouted
    const { data: existing } = await supabase
      .from('scout_reports')
      .select('*')
      .eq('club_id', clubId)
      .eq('player_id', playerId)
      .single()

    if (existing) {
      if (existing.level >= 2) throw new Error('Jugador ya ojeado al máximo')
      await supabase.from('scout_reports').update({ level: existing.level + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('scout_reports').insert([{ club_id: clubId, player_id: playerId, level: 1 }])
    }
    return true
  },
  
  // Generar algunos agentes libres ficticios si el mercado está vacío (MVP)
  async generateFreeAgents(count = 10) {
     const positions = ['GK', 'DF', 'MD', 'FW']
     const names = ['Carlos', 'Juan', 'Marcos', 'Luis', 'Pedro', 'Diego']
     const lasts = ['Gómez', 'Silva', 'Pérez', 'López', 'Martínez']
     
     const agents = Array.from({length: count}).map(() => ({
       first_name: names[Math.floor(Math.random() * names.length)],
       last_name: lasts[Math.floor(Math.random() * lasts.length)],
       position: positions[Math.floor(Math.random() * positions.length)],
       age: Math.floor(Math.random() * 15) + 18,
       attr_pace: Math.floor(Math.random() * 50) + 30,
       attr_shooting: Math.floor(Math.random() * 50) + 30,
       attr_passing: Math.floor(Math.random() * 50) + 30,
       attr_defending: Math.floor(Math.random() * 50) + 30,
       attr_physical: Math.floor(Math.random() * 50) + 30,
       state_fitness: 100,
       state_morale: 100
     }))
     
     const { error } = await supabase.from('players').insert(agents)
     if (error) console.error("Error generating free agents:", error)
  }
}
