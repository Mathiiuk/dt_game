import { supabase } from './supabase'

export const tacticsApi = {
  async getTactic(clubId) {
    let { data, error } = await supabase
      .from('tactics')
      .select('*')
      .eq('club_id', clubId)
      .single()

    if (error && error.code === 'PGRST116') {
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
        .insert([defaultTactic])
        .select()
        .single()
        
      if (insertError) throw new Error(insertError.message)
      return newTactic
    } else if (error) {
      throw new Error(error.message)
    }

    return data
  },

  async updateTactic(clubId, tacticData) {
    const { data, error } = await supabase
      .from('tactics')
      .update(tacticData)
      .eq('club_id', clubId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
