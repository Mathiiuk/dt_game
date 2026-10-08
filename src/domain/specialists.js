/**
 * Especialistas de pelota parada: quién patea mejor los penales y los tiros libres, quién saca los córners y quién los define de cabeza.
 * Se calculan con los atributos de cada jugador (los mismos para el motor del partido, las pantallas y el rival). Funciones puras.
 */

import { positionLine } from './positions'

const num = (v, fallback) => (v == null || Number.isNaN(Number(v)) ? fallback : Number(v))

const overall = (p) => num(p.attr_overall ?? p.overall, 50)
const lineOf = (p) => positionLine(p.slot_base || p.position)
const isKeeper = (p) => lineOf(p) === 'ARQ'
const isDefender = (p) => lineOf(p) === 'DEF'
const isForward = (p) => lineOf(p) === 'DEL'

/** Qué tan bueno es rematando de cabeza (0 a 100): lo usa el motor para dar más o menos peligro al córner */
export const aerialOf = (p) => num(p?.attr_heading, ROLE_SCORES.HEADER(p || {}))

/** Puntaje de cada rol (0 a 100 aprox.): mezcla de los atributos que más pesan */
export const ROLE_SCORES = {
  PENALTY: (p) => 0.55 * num(p.attr_finishing ?? p.attr_shooting, overall(p)) + 0.25 * num(p.attr_shooting, overall(p)) + 0.2 * overall(p),
  FREE_KICK: (p) => 0.45 * num(p.attr_shooting ?? p.attr_finishing, overall(p)) + 0.3 * num(p.attr_passing, overall(p)) + 0.25 * num(p.attr_vision, overall(p)),
  CORNER: (p) => 0.55 * num(p.attr_passing, overall(p)) + 0.3 * num(p.attr_vision, overall(p)) + 0.15 * overall(p),
  // Juego aéreo: el atributo de cabeceo manda, ayudado por la fuerza y el ubicarse en el área. Si el jugador no lo trae
  // (por ejemplo, los once de relleno del rival), se estima con el nivel general y la defensa y se favorece a defensores y delanteros
  HEADER: (p) => (p.attr_heading != null
    ? 0.6 * num(p.attr_heading, 50) + 0.2 * num(p.attr_strength, overall(p)) + 0.1 * num(p.attr_positioning, overall(p)) + 0.1 * num(p.attr_finishing, overall(p))
    : 0.5 * overall(p) + 0.3 * num(p.attr_defending, overall(p)) + 0.2 * num(p.attr_finishing, overall(p)) + (isDefender(p) ? 4 : 0) + (isForward(p) ? 3 : 0))
}

export const ROLE_LABELS = {
  PENALTY: 'Penales',
  FREE_KICK: 'Tiros libres',
  CORNER: 'Córners',
  HEADER: 'Cabezazos'
}

const fullName = (p) => `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Un jugador'

/**
 * El mejor de cada rol entre los jugadores disponibles (sin arqueros ni lesionados).
 * @returns {{ [role: string]: { id, name, score, player } | null }}
 */
export function specialistsOf(players = [], overrides = null) {
  const pool = players.filter(p => p && !isKeeper(p) && !p.is_injured)
  const out = {}
  for (const role of Object.keys(ROLE_SCORES)) {
    const ranked = [...pool].sort((a, b) => ROLE_SCORES[role](b) - ROLE_SCORES[role](a))
    // Lo elegido a mano manda mientras ese jugador pueda jugar (si se lesionó, salió de la cancha o es arquero, vuelve el automático)
    const manual = overrides?.[role] ? pool.find(p => p.id && p.id === overrides[role]) : null
    const best = manual || ranked[0]
    out[role] = best ? { id: best.id ?? null, name: fullName(best), score: Math.round(ROLE_SCORES[role](best)), player: best, manual: !!manual } : null
  }
  return out
}

/** Sólo las elecciones válidas (un id por rol conocido): lo que se guarda en la base */
export function cleanTakers(raw) {
  if (!raw || typeof raw !== 'object') return null
  const clean = {}
  for (const role of Object.keys(ROLE_SCORES)) if (typeof raw[role] === 'string' && raw[role]) clean[role] = raw[role]
  return Object.keys(clean).length ? clean : null
}

/** Los N mejores de un rol (para ofrecer pateadores): el especialista primero */
export const topFor = (players = [], role, n = 3, overrides = null) => {
  const ranked = players.filter(p => p && !isKeeper(p) && !p.is_injured).sort((a, b) => ROLE_SCORES[role](b) - ROLE_SCORES[role](a))
  const manual = overrides?.[role] ? ranked.find(p => p.id && p.id === overrides[role]) : null
  return (manual ? [manual, ...ranked.filter(p => p !== manual)] : ranked).slice(0, n)
}

/** ¿Es este jugador el especialista del rol? */
export const isSpecialist = (specialists, role, playerId) => !!playerId && specialists?.[role]?.id === playerId
