import { supabase } from './supabase'

export const tacticsApi = {
  async getTactic(clubId) {
    if (!clubId) return null

    let { data, error } = await supabase
      .from('tactics')
      .select('*')
      .eq('club_id', clubId)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.warn('Error fetching tactic:', error)
    }

    if (!data) {
      // Si no existe, crear la táctica por defecto
      const defaultTactic = {
        club_id: clubId,
        formation: '4-4-2',
        mentality: 'Equilibrada',
        pressure: 'Media',
        tempo: 'Normal',
        defensive_line: 'Media',
        build_up: 'Mixta',
        lineup: []
      }
      const { data: newTactic, error: insertError } = await supabase
        .from('tactics')
        .upsert(defaultTactic, { onConflict: 'club_id' })
        .select()
        .single()
        
      if (insertError) throw new Error(insertError.message)
      return newTactic
    }

    return data
  },

  async updateTactic(clubId, tacticData) {
    if (!clubId) throw new Error('Club ID requerido')
    
    // Desestructurar para no pisar la primary key ni columnas protegidas
    const { id, created_at, updated_at, ...cleanData } = tacticData || {}

    const { data, error } = await supabase
      .from('tactics')
      .upsert(
        { 
          ...cleanData, 
          club_id: clubId, 
          updated_at: new Date().toISOString() 
        }, 
        { onConflict: 'club_id' }
      )
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
