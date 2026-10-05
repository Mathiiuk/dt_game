import { useEffect } from 'react'
import { clockRuns, msPerMinute } from '../../domain/matchClock'

/**
 * Avanza el minuto del partido cada `msPerMinute(speed)`. Con pausa o sin partido en juego no avanza.
 * `onTick(siguienteMinuto)` hace el trabajo de cada minuto (eventos, marcador).
 */
export function useMatchClock({ active, paused, minute, speed, onTick }) {
  useEffect(() => {
    if (!clockRuns({ active, paused, minute })) return undefined
    const timer = setTimeout(() => onTick(minute + 1), msPerMinute(speed))
    return () => clearTimeout(timer)
    // onTick cambia en cada render: el reloj se reprograma solo cuando cambian el minuto, la velocidad o la pausa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused, minute, speed])
}
