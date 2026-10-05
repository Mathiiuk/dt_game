import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

/** Datos externos a los jugadores que alimentan la química: mentorías activas y arquetipos de personalidad */
export const chemistryApi = {
  async getContext(clubId, players = []) {
    if (!clubId) return { mentorPairs: new Set(), archetypes: new Map() }

    return queryCache.fetch(`chemistry:${clubId}`, async () => {
      const [{ data: mentorships }, { data: personalities }] = await Promise.all([
        supabase.from('player_mentorships').select('veteran_player_id, youth_player_id').eq('club_id', clubId).eq('status', 'ACTIVE'),
        players.length
          ? supabase.from('player_personalities').select('player_id, primary_archetype').in('player_id', players.map(p => p.id))
          : Promise.resolve({ data: [] })
      ])
      return {
        mentorPairs: new Set((mentorships || []).map(m => [m.veteran_player_id, m.youth_player_id].sort().join('|'))),
        archetypes: new Map((personalities || []).map(p => [p.player_id, p.primary_archetype]))
      }
    }, 60000)
  },

  /** Los jugadores con su arquetipo de personalidad (si lo tienen) */
  withArchetypes(players, context) {
    return players.map(p => ({ ...p, archetype: context.archetypes.get(p.id) || p.personality || null }))
  }
}
