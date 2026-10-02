import { getCollection, saveCollection } from './db'

export const managerApi = {
  async createManager(userId, managerData) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500))
    
    const managers = await getCollection('managers')
    
    // Check if user already has a manager profile (for MVP we assume 1 manager per user)
    const existing = managers.find(m => m.userId === userId)
    if (existing) {
      throw new Error('Ya tienes un perfil de Director Técnico creado.')
    }
    
    const newManager = {
      id: crypto.randomUUID(),
      userId,
      level: 1,
      xp: 0,
      reputation: 10,
      ...managerData, // identity, attributes, philosophy
      createdAt: new Date().toISOString()
    }
    
    managers.push(newManager)
    await saveCollection('managers', managers)
    
    return newManager
  },

  async getManager(userId) {
    const managers = await getCollection('managers')
    return managers.find(m => m.userId === userId) || null
  }
}
