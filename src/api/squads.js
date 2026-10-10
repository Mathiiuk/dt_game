import { supabase } from './supabase'

/** Plantilla (12 nombres con su línea) de un club de la IA, para nombrar a sus jugadores. Sin plantilla devuelve []. */
export const squadsApi = {
  async getClubSquad(clubName) {
    if (!clubName) return []
    const { data, error } = await supabase
      .from('real_squads')
      .select('slot, player_name, position')
      .eq('club_name', clubName)
      .order('slot')
    if (error) return []
    return data || []
  }
}
