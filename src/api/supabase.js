import { createClient } from '@supabase/supabase-js'
import { createNetFetch } from '../lib/netFetch'
import { setSlow } from '../lib/netStatus'
import { readCache } from '../lib/readCache'
import { supabaseUrl, supabaseAnonKey } from '../lib/supabaseEnv'

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
