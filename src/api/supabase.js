import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta?.env)
  ? import.meta.env
  : (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {})

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://qozozdaavjfxvssvxqbx.supabase.co'
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VtNbVt-LP7mmU-vQPA5v7w_DORDJBC7'

// Clave dedicada para almacenamiento persistente y aislado de sesión en PWA y navegador
export const AUTH_STORAGE_KEY = 'dt_supabase_auth_token'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: AUTH_STORAGE_KEY,
    flowType: 'pkce'
  }
})
