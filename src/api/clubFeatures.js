import { supabase } from './supabase'
import { buildYouthProspect, nextFreeShirtNumber } from './player'

export const staffApi = {
  async getStaff(clubId) {
    const { data, error } = await supabase.from('staff').select('*').eq('club_id', clubId)
    if (error) throw new Error(error.message)
    return data
  },
  
  async hireStaff(clubId, staffData) {
    const { error } = await supabase.from('staff').insert([{ ...staffData, club_id: clubId }])
    if (error) throw new Error(error.message)
  },
  
  async fireStaff(staffId) {
    const { error } = await supabase.from('staff').delete().eq('id', staffId)
    if (error) throw new Error(error.message)
  },
  
  async getAvailableStaff() {
    // Para MVP, generaremos una lista en memoria
    const roles = ['Ayudante', 'Preparador Físico', 'Scout', 'Médico']
    const names = ['Jorge', 'Martín', 'Marcelo', 'Ricardo', 'Eduardo']
    const lasts = ['Bielsa', 'Gallardo', 'Pekerman', 'Bilardo', 'Menotti']
    
    return Array.from({length: 4}).map(() => ({
      name: names[Math.floor(Math.random()*names.length)] + ' ' + lasts[Math.floor(Math.random()*lasts.length)],
      role: roles[Math.floor(Math.random()*roles.length)],
      level: Math.floor(Math.random()*3) + 1,
      salary: Math.floor(Math.random()*3000) + 1000
    }))
  }
}

export const academyApi = {
  async getYouthPlayers(clubId) {
    const { data, error } = await supabase.from('players').select('*').eq('club_id', clubId).eq('is_youth', true)
    if (error) throw new Error(error.message)
    return data
  },
  
  async promoteToFirstTeam(playerId) {
    const { error } = await supabase.from('players').update({ is_youth: false, contract_salary: 2000 }).eq('id', playerId)
    if (error) throw new Error(error.message)
  },
  
  async generateYouthProspect(clubId, academyLevel) {
    // Dorsal libre y datos del club (nacionalidad y fecha de juego para el contrato)
    const [{ data: squad }, { data: club }] = await Promise.all([
      supabase.from('players').select('shirt_number').eq('club_id', clubId),
      supabase.from('clubs').select('country, game_date, league_tier').eq('id', clubId).maybeSingle()
    ])
    const prospect = buildYouthProspect({
      clubId,
      academyLevel,
      tier: club?.league_tier || 5,
      shirtNumber: nextFreeShirtNumber((squad || []).map(p => p.shirt_number)),
      nationality: club?.country || 'Argentina',
      gameDate: club?.game_date || '2026-07-01'
    })

    const { error } = await supabase.from('players').insert([prospect])
    if (error) throw new Error(error.message)
  }
}
