/**
 * Reloj del partido en vivo: velocidades y tiempo real entre minutos simulados.
 * x1 es lento y legible (un partido dura alrededor de un minuto) y x2 es la velocidad que antes era la normal.
 * Saltear el partido es una acción aparte, no una velocidad.
 */
export const MATCH_SPEEDS = [
  { id: 1, label: 'x1', ms: 700, hint: 'Lento: leé cada jugada' },
  { id: 2, label: 'x2', ms: 150, hint: 'Normal' }
]

export const DEFAULT_SPEED = 1
export const MATCH_MINUTES = 90

/** Milisegundos reales entre minutos simulados (si la velocidad no existe se usa la lenta) */
export const msPerMinute = (speed) => (MATCH_SPEEDS.find(s => s.id === speed) || MATCH_SPEEDS[0]).ms

/** Duración aproximada de un partido completo a una velocidad, en segundos */
export const matchSeconds = (speed) => Math.round((msPerMinute(speed) * MATCH_MINUTES) / 1000)

/** ¿Corre el reloj? Solo con el partido en juego, sin pausa y antes del minuto final */
export const clockRuns = ({ active, paused, minute }) => Boolean(active) && !paused && minute < MATCH_MINUTES
