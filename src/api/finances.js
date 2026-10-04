import { supabase } from './supabase'
import { queryCache } from '../utils/cache'

export const financesApi = {
  async getFinances(clubId) {
    if (!clubId) return null

    return queryCache.fetch(`finances:${clubId}`, async () => {
      const { data: club, error } = await supabase.from('clubs').select('*').eq('id', clubId).single()
      if (error) throw new Error(error.message)
      
      // Calcular sueldos jugadores
      const { data: players } = await supabase.from('players').select('contract_salary').eq('club_id', clubId)
      const playerWages = players ? players.reduce((sum, p) => sum + (p.contract_salary || 0), 0) : 0
      
      // Calcular sueldos staff
      const { data: staff } = await supabase.from('staff').select('salary').eq('club_id', clubId)
      const staffWages = staff ? staff.reduce((sum, s) => sum + (s.salary || 0), 0) : 0
      
      // Mantenimiento de instalaciones
      const maintenance = (club.stadium_level * 5000) + (club.medical_level * 2000) + (club.academy_level * 3000)
      
      const totalExpenses = playerWages + staffWages + maintenance
      
      // Ingresos base + sponsors + tienda (store_level)
      const sponsors = club.reputation * 1000
      const storeIncome = club.store_level * 2000
      const tvRights = club.reputation * 5000
      
      const totalIncome = sponsors + storeIncome + tvRights
      
      return {
        balance: club.budget,
        debt: club.debt,
        wageBudget: club.wage_budget,
        expenses: { playerWages, staffWages, maintenance, total: totalExpenses },
        income: { sponsors, storeIncome, tvRights, total: totalIncome },
        monthlyProfit: totalIncome - totalExpenses
      }
    }, 60000)
  },
  
  async upgradeFacility(clubId, facilityType, cost, currentLevel) {
    // facilityType: 'stadium_level', 'medical_level', 'store_level'
    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    if (club.budget < cost) throw new Error('Presupuesto insuficiente')
    
    const updates = { budget: club.budget - cost }
    updates[facilityType] = currentLevel + 1
    
    const { error } = await supabase.from('clubs').update(updates).eq('id', clubId)
    if (error) throw new Error(error.message)

    queryCache.invalidate('finances:')
    queryCache.invalidate('club:')
  }
}
