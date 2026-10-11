import { supabase } from '../../api/supabase'

/** Caja actual del club (para contar cuánto cambió en la semana) */
export const readClubBudget = (clubId) => async () => {
  const { data } = await supabase.from('clubs').select('budget').eq('id', clubId).maybeSingle()
  return data ? Number(data.budget) : null
}
