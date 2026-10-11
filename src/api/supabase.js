import { createClient } from '@supabase/supabase-js'
import { createNetFetch } from '../lib/netFetch'
import { setSlow } from '../lib/netStatus'
import { readCache } from '../lib/readCache'

const env = (typeof import.meta !== 'undefined' && import.meta?.env)
  ? import.meta.env
  : (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {})

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://qozozdaavjfxvssvxqbx.supabase.co'
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VtNbVt-LP7mmU-vQPA5v7w_DORDJBC7'

// Clave dedicada para almacenamiento persistente y aislado de sesión en PWA y navegador
export const AUTH_STORAGE_KEY = 'dt_supabase_auth_token'

// Lecturas con tiempo máximo y reintentos, escrituras intactas, y aviso de "conexión lenta" (ver lib/netFetch)
const netFetch = createNetFetch({ onSlowChange: setSlow, store: readCache })

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: netFetch },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: AUTH_STORAGE_KEY,
    flowType: 'pkce'
  }
})
