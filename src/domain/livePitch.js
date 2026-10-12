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
