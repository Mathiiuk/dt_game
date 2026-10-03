import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qozozdaavjfxvssvxqbx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VtNbVt-LP7mmU-vQPA5v7w_DORDJBC7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
