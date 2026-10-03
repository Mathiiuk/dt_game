import { supabase } from './supabase'

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
    const positions = ['GK', 'DF', 'MD', 'FW']
    const names = ['Thiago', 'Mateo', 'Enzo', 'Bautista']
    const lasts = ['Fernández', 'García', 'Díaz', 'Alvarez']
    
    // Potencial aumenta con el nivel de academia
    const basePotential = 60 + (academyLevel * 5)
    
    const prospect = {
      club_id: clubId,
      first_name: names[Math.floor(Math.random()*names.length)],
      last_name: lasts[Math.floor(Math.random()*lasts.length)],
      position: positions[Math.floor(Math.random()*positions.length)],
      age: 16,
      attr_pace: Math.floor(Math.random() * 40) + 20,
      attr_shooting: Math.floor(Math.random() * 40) + 20,
      attr_passing: Math.floor(Math.random() * 40) + 20,
      attr_tackling: Math.floor(Math.random() * 40) + 20,
      attr_strength: Math.floor(Math.random() * 40) + 20,
      attr_stamina: Math.floor(Math.random() * 40) + 20,
      attr_potential: basePotential + Math.floor(Math.random() * 10),
      state_fitness: 100,
      state_morale: 100,
      is_youth: true
    }
    
    const { error } = await supabase.from('players').insert([prospect])
    if (error) throw new Error(error.message)
  }
}
