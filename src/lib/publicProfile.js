// Perfil público del DT: se pide con un fetch directo a la función pública de la base (igual que la tabla de mejores DT).
// Solo existe para quien aceptó aparecer; la función devuelve nombre, puntos, títulos, victorias, puesto y los colores de la camiseta.
import { supabaseUrl, supabaseAnonKey } from './supabaseEnv'
import { normalizeJerseyPattern } from '../domain/jerseyKits'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const COLOR = /^#[0-9a-fA-F]{6}$/

export const isValidSlug = (slug) => typeof slug === 'string' && slug.length >= 3 && slug.length <= 40 && SLUG.test(slug)
export const profilePath = (slug) => `/dt/${slug}`

const color = (value, fallback) => (COLOR.test(String(value || '')) ? value : fallback)

/** Devuelve el perfil o null (no existe, no aceptó aparecer o la dirección no es válida) */
export async function fetchPublicProfile(slug, { fetchImpl = (...a) => fetch(...a), signal } = {}) {
  if (!isValidSlug(slug)) return null
  const res = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/public_manager_profile`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_slug: slug }),
    credentials: 'omit',
    signal
  })
  if (!res.ok) throw new Error(`No se pudo cargar el perfil (${res.status})`)
  const rows = await res.json()
  const r = Array.isArray(rows) ? rows[0] : null
  if (!r || !String(r.manager_name || '').trim()) return null
  return {
    name: String(r.manager_name).trim().slice(0, 40),
    points: Number(r.points) || 0,
    titlesNational: Number(r.titles_national) || 0,
    titlesContinental: Number(r.titles_continental) || 0,
    played: Number(r.matches_played) || 0,
    won: Number(r.matches_won) || 0,
    rank: r.rank == null ? null : Number(r.rank) || null,
    kit: { primary: color(r.primary_color, '#047857'), secondary: color(r.secondary_color, '#FFFFFF'), pattern: normalizeJerseyPattern(r.jersey_pattern) }
  }
}
