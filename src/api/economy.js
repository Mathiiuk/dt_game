import { supabase } from './supabase'

export const economyApi = {
  async getFinances(clubId) {
    const { data, error } = await supabase
      .from('club_finances')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(50)
      
    if (error) throw new Error(error.message)
    return data
  },
  
  async logTransaction(clubId, type, category, amount, description, gameDate) {
    const { error } = await supabase
      .from('club_finances')
      .insert([{
        club_id: clubId,
        transaction_type: type, // 'INCOME', 'EXPENSE'
        category: category, // 'MATCH_DAY', 'TV', 'SPONSOR', 'SALARY', 'TRANSFER', 'MAINTENANCE'
        amount: amount,
        description: description,
        game_date: gameDate
      }])
      
    if (error) throw new Error(error.message)
  },

  async processWeeklyFinances(clubId, gameDate, players) {
    // 1. Calculate player salaries
    let totalSalaries = 0
    players.forEach(p => {
      // Annual salary divided by 52 weeks
      totalSalaries += Math.round((p.contract_salary || 1000) / 52)
    })

    // Calculate staff salaries
    const { data: staff } = await supabase.from('staff').select('salary').eq('club_id', clubId)
    if (staff) {
      staff.forEach(s => {
        totalSalaries += Math.round((s.salary || 1000) / 4)
      })
    }
    
    // 2. Add some staff or maintenance
    const maintenance = 5000
    
    // 3. Weekly Income (Sponsor / TV)
    const sponsorIncome = 25000
    const tvIncome = 15000
    
    // Get current club budget
    const { data: club } = await supabase.from('clubs').select('budget').eq('id', clubId).single()
    if (!club) return
    
    let newBudget = club.budget
    
    // Deduct expenses
    if (totalSalaries > 0) {
      newBudget -= totalSalaries
      await this.logTransaction(clubId, 'EXPENSE', 'SALARY', totalSalaries, 'Sueldos de la semana', gameDate)
    }
    
    newBudget -= maintenance
    await this.logTransaction(clubId, 'EXPENSE', 'MAINTENANCE', maintenance, 'Mantenimiento semanal', gameDate)
    
    // Add income
    const totalIncome = sponsorIncome + tvIncome
    newBudget += totalIncome
    await this.logTransaction(clubId, 'INCOME', 'SPONSOR', sponsorIncome, 'Patrocinador semanal', gameDate)
    await this.logTransaction(clubId, 'INCOME', 'TV', tvIncome, 'Derechos de TV semanales', gameDate)
    
    // Update club
    await supabase.from('clubs').update({ budget: newBudget }).eq('id', clubId)
    
    return {
      income: totalIncome,
      expenses: totalSalaries + maintenance,
      newBudget
    }
  }
}
