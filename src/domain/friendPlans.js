/**
 * Fechas interactivas de la sala: planteo (piedra-papel-tijera), arenga, plazo y prode.
 * Funciones puras; el servidor aplica y valida todo (`friend_set_plan`, `friend_predict`, `friend_play_round`).
 * Los planteos solo cambian el resultado de los partidos de la sala: nunca el club, el plantel ni la caja de una cuenta.
 */

export const STANCES = [
  { id: 'PRESION', name: 'Presión', blurb: 'Salís a comerte a todos: le gana al planteo Equilibrado y pierde contra la Contra.' },
  { id: 'EQUILIBRADO', name: 'Equilibrado', blurb: 'Ni muy muy ni tan tan: le gana a la Contra y pierde contra la Presión. Es el que queda si no elegís.' },
  { id: 'CONTRA', name: 'Contra', blurb: 'Te cerrás y esperás el error: le gana a la Presión y pierde contra el Equilibrado.' }
]

export const CHEERS = [
  { id: 'GARRA', name: 'Garra', blurb: '“¡Hoy se muere en la cancha!” Sale en el relato del partido.' },
  { id: 'CALMA', name: 'Calma', blurb: '“Tranquilos, esto se resuelve con la pelota.” Sale en el relato.' },
  { id: 'PICARDIA', name: 'Picardía', blurb: '“Si el árbitro no mira, mejor.” Sale en el relato.' }
]

export const DEADLINE_HOURS = [12, 24, 48]
export const DEFAULT_DEADLINE_HOURS = 24

const BEATS = { PRESION: 'EQUILIBRADO', EQUILIBRADO: 'CONTRA', CONTRA: 'PRESION' }

export const stanceById = (id) => STANCES.find(s => s.id === id) || null

export const stanceBeats = (a, b) => BEATS[a] === b

/** Cómo le va a mi planteo contra el del rival: 'wins', 'loses' o 'even' */
export const stanceEdge = (mine, theirs) => (stanceBeats(mine, theirs) ? 'wins' : stanceBeats(theirs, mine) ? 'loses' : 'even')

/** Tiempo que falta para el cierre de la fecha */
export function timeLeft(deadline, now = Date.now()) {
  if (!deadline) return ''
  const ms = new Date(deadline).getTime() - now
  if (ms <= 0) return 'venció'
  const min = Math.floor(ms / 60000)
  if (min >= 2880) return `${Math.floor(min / 1440)} días`
  if (min >= 60) return `${Math.floor(min / 60)} h ${min % 60} min`
  return `${Math.max(1, min)} min`
}

/** Resultado de un partido jugado: L (gana el local), E (empate) o V (gana el visitante); en las llaves manda el ganador */
export function resultPick(f) {
  if (f.home_goals == null || f.away_goals == null) return null
  if (f.winner_slot != null) return f.winner_slot === f.home_slot ? 'L' : 'V'
  return f.home_goals > f.away_goals ? 'L' : f.home_goals < f.away_goals ? 'V' : 'E'
}

/** En las llaves siempre hay ganador: no se pronostica empate */
export const canPick = (fixture, pick) => !(fixture.stage === 'LLAVE' && pick === 'E')

export const pickLabel = (pick, { home, away }) => (pick === 'L' ? `Gana ${home}` : pick === 'V' ? `Gana ${away}` : 'Empatan')
