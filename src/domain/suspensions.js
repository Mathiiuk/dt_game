// Suspensiones por tarjetas (todo puro): una roja o la 5ª amarilla de la temporada dejan afuera del próximo partido.
export const YELLOWS_FOR_BAN = 5
export const RED_BAN_MATCHES = 1
export const BAN_MATCHES_BY_YELLOWS = 1

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

/**
 * Efecto de las tarjetas de un partido sobre el jugador. Devuelve los campos a guardar o `null` si no hay tarjetas.
 * Roja directa o doble amarilla = expulsión (no suma al contador); la 5ª amarilla de la temporada suspende y el contador vuelve a 0.
 */
export function applyMatchCards(player, { yellows = 0, reds = 0 } = {}) {
  const y = num(yellows)
  const r = num(reds)
  if (y <= 0 && r <= 0) return null

  const season = num(player?.yellow_cards_season)
  const pending = num(player?.suspended_matches)
  const reason = player?.suspension_reason || null
  const expelled = r > 0 || y >= 2

  if (expelled) {
    return { yellow_cards_season: season, suspended_matches: pending + RED_BAN_MATCHES, suspension_reason: 'RED', is_suspended: true }
  }
  const total = season + y
  if (total >= YELLOWS_FOR_BAN) {
    return { yellow_cards_season: 0, suspended_matches: pending + BAN_MATCHES_BY_YELLOWS, suspension_reason: reason === 'RED' ? 'RED' : 'YELLOWS', is_suspended: true }
  }
  return { yellow_cards_season: total, suspended_matches: pending, suspension_reason: reason, is_suspended: Boolean(player?.is_suspended) }
}

/** Un suspendido que no pudo jugar cumple un partido: se descuenta y, al llegar a 0, queda habilitado. `null` si no estaba suspendido. */
export function serveSuspension(player) {
  if (!player?.is_suspended) return null
  const left = Math.max(0, num(player.suspended_matches) - 1)
  return left > 0
    ? { suspended_matches: left, suspension_reason: player.suspension_reason || null, is_suspended: true }
    : { suspended_matches: 0, suspension_reason: null, is_suspended: false }
}

/** Qué insignia mostrar: 'injured' | 'red' | 'yellow-ban' | 'warning' (apercibido) | null */
export function cardStatus(player) {
  if (!player) return null
  if (player.is_injured) return 'injured'
  if (player.is_suspended) return player.suspension_reason === 'YELLOWS' ? 'yellow-ban' : 'red'
  if (num(player.yellow_cards_season) === YELLOWS_FOR_BAN - 1) return 'warning'
  return null
}

/** Frase corta para etiquetas y detalle */
export function suspensionNote(player) {
  const status = cardStatus(player)
  if (status === 'yellow-ban') return `Suspendido por acumular ${YELLOWS_FOR_BAN} amarillas: se pierde el próximo partido.`
  if (status === 'red' || (player?.is_suspended && status === 'injured')) return 'Suspendido por expulsión: se pierde el próximo partido.'
  if (status === 'warning') return `Tiene ${YELLOWS_FOR_BAN - 1} amarillas: con otra se pierde el próximo partido.`
  return ''
}

/**
 * Cambios de sanciones tras un partido: los que jugaron suman sus tarjetas y los suspendidos que no jugaron cumplen una fecha.
 * `events` son los del partido (CARD_YELLOW / CARD_RED con `playerId`). Devuelve filas `{ id, ...campos }` solo de quienes cambian.
 */
export function suspensionUpdates({ players = [], playedIds = [], events = [] } = {}) {
  const played = new Set(playedIds)
  const count = (type, id) => events.filter(e => e.type === type && e.playerId === id).length
  const rows = []
  for (const p of players) {
    const change = played.has(p.id)
      ? applyMatchCards(p, { yellows: count('CARD_YELLOW', p.id), reds: count('CARD_RED', p.id) })
      : serveSuspension(p)
    if (change) rows.push({ id: p.id, ...change })
  }
  return rows
}

/** Une filas por `id` (el lote de la base aplica una sola fila por jugador): las claves de `extra` se suman a las de `base` */
export function mergeRowsById(base = [], extra = []) {
  const byId = new Map(base.map(r => [r.id, r]))
  for (const r of extra) byId.set(r.id, { ...(byId.get(r.id) || {}), ...r })
  return [...byId.values()]
}
