// URL y clave pública de Supabase (la clave "publishable" es pública por diseño: la seguridad la dan las políticas de la base)
const env = (typeof import.meta !== 'undefined' && import.meta?.env)
  ? import.meta.env
  : (typeof globalThis !== 'undefined' && globalThis.process?.env ? globalThis.process.env : {})

export const supabaseUrl = env.VITE_SUPABASE_URL || 'https://qozozdaavjfxvssvxqbx.supabase.co'
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VtNbVt-LP7mmU-vQPA5v7w_DORDJBC7'
