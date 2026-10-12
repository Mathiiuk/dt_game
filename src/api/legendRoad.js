import { supabase } from './supabase'

/** Camino a la leyenda: mis puntos de legado y los de las leyendas de la tabla pública (lo calcula el servidor) */
export const legendRoadApi = {
  async get() {
    const { data, error } = await supabase.rpc('legend_road')
    if (error) throw new Error(error.message)
    return data || null
  }
}
