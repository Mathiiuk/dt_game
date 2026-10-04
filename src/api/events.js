import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const eventsApi = {
  async getPendingEvents(clubId) {
    if (!clubId) return []

    return queryCache.fetch(`events:pending:${clubId}`, async () => {
      const { data, error } = await supabase
        .from('dynamic_events')
        .select('*')
        .eq('club_id', clubId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        
      if (error) throw new Error(error.message)
      return data || []
    }, 45000)
  },

  async resolveEvent(eventId, chosenOption) {
    // chosenOption contains { id, label, effects: { budget, board, fans } }
    
    // 1. Get event
    const { data: event } = await supabase.from('dynamic_events').select('*').eq('id', eventId).single()
    if (!event) throw new Error('Event not found')
    
    // 2. Mark as resolved
    await supabase.from('dynamic_events').update({ status: 'RESOLVED' }).eq('id', eventId)
    queryCache.invalidate('events:')
    
    // 3. Apply effects to club
    if (chosenOption.effects) {
      const { data: club } = await supabase.from('clubs').select('budget, board_confidence, fans_confidence').eq('id', event.club_id).single()
      
      const newBudget = club.budget + (chosenOption.effects.budget || 0)
      const newBoard = Math.min(100, Math.max(0, club.board_confidence + (chosenOption.effects.board || 0)))
      const newFans = Math.min(100, Math.max(0, club.fans_confidence + (chosenOption.effects.fans || 0)))
      
      await supabase.from('clubs').update({
        budget: newBudget,
        board_confidence: newBoard,
        fans_confidence: newFans
      }).eq('id', event.club_id)
    }
  },

  async generateRandomEvents(clubId, managerId) {
    // 10% chance per week to get an event
    if (Math.random() > 0.10) return

    // MVP Event catalog
    const catalog = [
      {
        title: 'Mensaje del Presidente',
        description: 'Míster, confío en que el equipo empiece a mostrar los resultados prometidos. Necesitamos ganar.',
        options: [
          { id: 'ACCEPT', label: 'Aceptar el desafío (+10% Fans, -5% Dirigencia si pierdes)', effects: { fans: 5 } },
          { id: 'DELAY', label: 'Pedir paciencia (+5% Dirigencia)', effects: { board: 5 } }
        ]
      },
      {
        title: 'Oferta de Patrocinio Local',
        description: 'Una empresa local de panadería quiere poner un cartel en el estadio por $20,000, pero piden entradas gratis.',
        options: [
          { id: 'ACCEPT', label: 'Aceptar Patrocinador (+$20,000, -2% Fans)', effects: { budget: 20000, fans: -2 } },
          { id: 'REJECT', label: 'Rechazar Oferta (+2% Fans)', effects: { fans: 2 } }
        ]
      },
      {
        title: 'Queja del Capitán',
        description: 'El capitán del equipo dice que los entrenamientos son muy duros y los jugadores están cansados.',
        options: [
          { id: 'SOFTEN', label: 'Bajar la intensidad (Físico +)', effects: { board: -2 } },
          { id: 'IGNORE', label: 'Ignorar queja (Riesgo lesión)', effects: { fans: -5 } }
        ]
      }
    ]

    const selected = catalog[Math.floor(Math.random() * catalog.length)]

    await supabase.from('dynamic_events').insert({
      club_id: clubId,
      manager_id: managerId,
      title: selected.title,
      description: selected.description,
      options: selected.options
    })
  }
}
