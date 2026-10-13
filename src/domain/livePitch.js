/**
 * Cancha en vivo (decorativa): de las jugadas del relato sale dónde está la pelota y qué se festeja.
 * El local ataca hacia la derecha (x = 100) y el visitante hacia la izquierda (x = 0); y va de 0 (arriba) a 100 (abajo).
 */
export const FIELD = { penaltySpotRight: 89, penaltySpotLeft: 11 }

// Cuántos minutos queda "viva" una jugada: la pelota la sigue y después vuelve a circular por el medio
const RECENT = 2
// Jugadas que no mueven la pelota (órdenes, cambios, final)
const SILENT = new Set(['TACTIC_SHOUT', 'SUBSTITUTION', 'RIVAL_TACTIC', 'END'])
const ATTACK = new Set(['GOAL', 'SHOT', 'MISS', 'SAVE', 'KEYPLAY', 'COUNTER'])

const clampMinute = (m) => (Number.isFinite(Number(m)) ? Number(m) : 0)
// Un número estable de 0 a 1 a partir del minuto (nada de azar: la misma jugada se ve igual cada vez)
const wobble = (minute, k) => (Math.sin(minute * k) + 1) / 2

export function pitchState({ events, minute }) {
  const now = clampMinute(minute)
  const list = (Array.isArray(events) ? events : []).filter(e => e && Number.isFinite(e.minute) && (e.team === 'home' || e.team === 'away' || e.type === 'END') && e.minute <= now)
  const recent = list.filter(e => now - e.minute <= RECENT)

  const live = [...recent].reverse().find(e => !SILENT.has(e.type) && !e.type?.startsWith('CARD_') && e.type !== 'INJURY')
  const lastOf = (pred) => [...recent].reverse().find(pred)

  const goalEvent = lastOf(e => e.type === 'GOAL' && now - e.minute <= 1)
  const cardEvent = lastOf(e => e.type === 'CARD_YELLOW' || e.type === 'CARD_RED')

  let ball = { x: 50 + 22 * Math.sin(now * 1.7), y: 50 + 18 * Math.cos(now * 2.3) }
  let focus = null
  if (live) {
    const home = live.team === 'home'
    const y = 36 + wobble(live.minute, 3.1) * 28
    focus = { type: live.type, team: live.team, minute: live.minute }
    if (live.type === 'PENALTY') ball = { x: home ? FIELD.penaltySpotRight : FIELD.penaltySpotLeft, y: 50 }
    else if (live.type === 'CORNER' || live.type === 'SETPIECE_CORNER') ball = { x: home ? 97 : 3, y: live.minute % 2 === 0 ? 8 : 92 }
    else if (live.type === 'SETPIECE_FK') ball = { x: home ? 75 : 25, y }
    else if (live.type === 'CLEARED') ball = { x: home ? 30 : 70, y }
    else if (ATTACK.has(live.type)) ball = { x: home ? 88 : 12, y }
  }

  return {
    ball: { x: Math.round(ball.x * 10) / 10, y: Math.round(ball.y * 10) / 10 },
    focus,
    goal: goalEvent ? { team: goalEvent.team, minute: goalEvent.minute } : null,
    card: cardEvent ? { kind: cardEvent.type === 'CARD_RED' ? 'red' : 'yellow', team: cardEvent.team, minute: cardEvent.minute } : null
  }
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

/**
 * Posiciones de los jugadores de un equipo sobre la cancha horizontal (porcentajes de 0 a 100).
 * Parte de la formación (x de izquierda a derecha, y de arriba = arco rival a abajo = arco propio) y la gira:
 * el local ataca hacia la derecha y el visitante hacia la izquierda. El bloque se corre un poco hacia donde está la pelota
 * (el arquero casi no se mueve) para que se sienta que el equipo sube y baja.
 */
export function dotsFor({ layout, side, ball = { x: 50, y: 50 }, shift = 0.16 }) {
  if (!Array.isArray(layout)) return []
  const home = side !== 'away'
  const pull = (clamp(Number(ball?.x) || 50, 0, 100) - 50) * shift
  return layout
    .filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))
    .map(p => {
      const keeper = p.y > 85
      const baseX = home ? 100 - p.y : p.y
      const baseY = home ? p.x : 100 - p.x
      return { slot: p.slot, x: Math.round(clamp(baseX + pull * (keeper ? 0.25 : 1), 3, 97) * 10) / 10, y: Math.round(clamp(keeper ? 50 : baseY, 4, 96) * 10) / 10 }
    })
}

const MARKER_KIND = { GOAL: 'goal', CARD_YELLOW: 'yellow', CARD_RED: 'red', SUBSTITUTION: 'sub' }

/** Goles, tarjetas y cambios ya ocurridos (hasta el minuto actual), en orden, para la línea de tiempo del partido */
export function matchMarkers(events, minute) {
  const now = clampMinute(minute)
  return (Array.isArray(events) ? events : [])
    .filter(e => e && MARKER_KIND[e.type] && Number.isFinite(e.minute) && e.minute <= now && (e.team === 'home' || e.team === 'away'))
    .map(e => ({ minute: e.minute, kind: MARKER_KIND[e.type], team: e.team }))
    .sort((a, b) => a.minute - b.minute)
}
