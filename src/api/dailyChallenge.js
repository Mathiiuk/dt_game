import { supabase } from './supabase'

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

/** Reto del día: los dilemas, el puntaje y la tabla los decide el servidor (el navegador solo manda las opciones elegidas) */
export const dailyApi = {
  /** Los tres dilemas de hoy, el objetivo y, si ya jugué, mi resultado */
  async get() {
    return unwrap(await supabase.rpc('daily_get'))
  },

  /** Juego el reto con una opción por dilema (los ids de las opciones, en orden). Una vez por día. */
  async submit(choices) {
    return unwrap(await supabase.rpc('daily_submit', { p_choices: choices }))
  },

  /** Tabla de hoy: de todos o solo de mis compañeros de sala */
  async board(friends = false) {
    return unwrap(await supabase.rpc('daily_board', { p_friends: friends, p_day: null })) || []
  }
}
