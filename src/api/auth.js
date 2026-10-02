import { getCollection, saveCollection } from './db'

// Simple hash simulation
const hashPassword = (password) => btoa(password + '_salt')

export const authApi = {
  async register({ name, email, password }) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500))
    
    const users = await getCollection('users')
    
    if (users.find(u => u.email === email)) {
      throw new Error('El correo electrónico ya está en uso.')
    }
    
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.')
    }
    
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    await saveCollection('users', users)
    
    // Create token
    const token = btoa(newUser.id + '-' + Date.now())
    return { user: { id: newUser.id, name: newUser.name, email: newUser.email }, token }
  },
  
  async login({ email, password }) {
    await new Promise(r => setTimeout(r, 500))
    const users = await getCollection('users')
    
    const user = users.find(u => u.email === email && u.passwordHash === hashPassword(password))
    
    if (!user) {
      throw new Error('Credenciales incorrectas.')
    }
    
    const token = btoa(user.id + '-' + Date.now())
    return { user: { id: user.id, name: user.name, email: user.email }, token }
  },

  async getSession(token) {
    if (!token) return null
    // In a real app we decode/verify JWT. Here we just split the mock token.
    try {
      const decoded = atob(token)
      const [userId] = decoded.split('-')
      const users = await getCollection('users')
      const user = users.find(u => u.id === userId)
      
      if (!user) return null
      return { id: user.id, name: user.name, email: user.email }
    } catch {
      return null
    }
  }
}
