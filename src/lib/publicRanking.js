// Tabla pública "Los mejores DT": se pide con un fetch directo a la función pública de la base (sin cargar el cliente de Supabase
// ni la sesión: la portada tiene que quedar liviana). Solo viaja la clave pública; la función devuelve nombre, puntos, títulos y victorias.
import { supabaseUrl, supabaseAnonKey } from './supabaseEnv'

const MAX_NAME = 40

/** Deja solo filas con nombre y puntos válidos, y recorta lo que se muestra */
export function normalizeRows(rows) {
  if (!Array.isArray(rows)) throw new Error('Respuesta inesperada')
  return rows
    .filter(r => r && String(r.manager_name || '').trim() && Number.isFinite(Number(r.points)))
    .map(r => ({
      rank: Number(r.rank) || 0,
      name: String(r.manager_name).trim().slice(0, MAX_NAME),
      points: Number(r.points),
      titles: Number(r.titles) || 0,
      won: Number(r.matches_won) || 0,
      legend: Boolean(r.is_legend)
    }))
}

export async function fetchTopManagers(limit = 3, { fetchImpl = (...a) => fetch(...a), signal } = {}) {
  const res = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/public_top_managers_v2`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_limit: limit }),
    credentials: 'omit',
    signal
  })
  if (!res.ok) throw new Error(`No se pudo cargar la tabla (${res.status})`)
  return normalizeRows(await res.json())
}
