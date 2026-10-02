import { supabase } from './supabase'

export const authApi = {
  async register({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name
        }
      }
    })
    
    if (error) throw new Error(error.message)
    
    return { 
      user: { id: data.user.id, name: data.user.user_metadata.display_name, email: data.user.email }, 
      token: data.session?.access_token 
    }
  },
  
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw new Error(error.message)
    
    return { 
      user: { id: data.user.id, name: data.user.user_metadata.display_name, email: data.user.email }, 
      token: data.session?.access_token 
    }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) return null
    
    const user = session.user
    return { 
      id: user.id, 
      name: user.user_metadata.display_name, 
      email: user.email 
    }
  },
  
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }
}
