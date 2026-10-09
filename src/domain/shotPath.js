// Trayectorias de los minijuegos del partido (penal, tiro libre, remate en contra y córner).
// Reglas puras con el azar inyectable: la pelota ya no va siempre al mismo lugar. Es solo la animación; el resultado
// (gol, atajada, tribuna) lo sigue decidiendo el motor del partido con la zona apuntada y la calidad del golpe.

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

export const ZONE_X = { L: 17, C: 50, R: 83 } // % del ancho del arco
export const OFF_TARGET_QUALITY = 0.15 // por debajo de esto el motor manda la pelota a la tribuna

/**
 * Adónde llega la pelota del penal o el tiro libre, en % del arco (x de izquierda a derecha, y desde el piso).
 * Un buen golpe va más preciso y pegado al piso o al ángulo; uno flojo se desparrama y cae al medio del arco;
 * uno muy malo se va afuera (al costado o por arriba), igual que cuenta el relato. `ms` es lo que tarda en llegar.
 */
export function shotPath({ aim = 'C', quality = 0.5 } = {}, rng = Math.random) {
  const q = clamp(Number(quality) || 0, 0, 1)
  const center = ZONE_X[aim] ?? 50
  const spread = 4 + 14 * (1 - q)
  let x = clamp(center + (rng() * 2 - 1) * spread, 8, 92)
  let y
  if (q >= 0.7) y = rng() < 0.5 ? 10 + rng() * 14 : 72 + rng() * 18 // rasante al palo o al ángulo
  else if (q >= 0.3) y = 28 + rng() * 40
  else y = 42 + rng() * 42
  let off = null
  if (q < OFF_TARGET_QUALITY) {
    const r = rng()
    off = r < 0.34 ? 'OVER' : x < 50 ? 'WIDE_L' : 'WIDE_R'
    if (off === 'OVER') y = 118 + rng() * 14
    else x = off === 'WIDE_L' ? -14 - rng() * 8 : 114 + rng() * 8
  }
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, off, ms: Math.round(380 + rng() * 180) }
}

/** El remate en contra: de dónde sale, cuánto tarda en llegar, a qué altura entra y cuánto se corre del centro de su zona */
export function flightPlan(rng = Math.random) {
  return {
    startX: Math.round(30 + rng() * 40), // sale de un lado u otro, no siempre del medio
    flightMs: Math.round(700 + rng() * 300),
    endTop: Math.round(26 + rng() * 18), // % desde arriba
    jitterX: Math.round((rng() * 2 - 1) * 7) // % de corrimiento dentro de la zona
  }
}

/** El córner: dónde cae la pelota dentro de la zona elegida del área (x en % del ancho, y en px desde arriba) */
const CORNER_X = { NEAR: [8, 32], MID: [38, 62], FAR: [68, 92] }
export function cornerLanding(zone = 'MID', rng = Math.random) {
  const [lo, hi] = CORNER_X[zone] || CORNER_X.MID
  return { x: Math.round(lo + rng() * (hi - lo)), y: Math.round(20 + rng() * 70) }
}

/** La barra de potencia: arranca en un punto y a una velocidad distintos cada vez, para que el timing no se memorice */
export function sweepPhase(rng = Math.random) {
  return { duration: Math.round((0.65 + rng() * 0.3) * 100) / 100, delay: -Math.round(rng() * 160) / 100 }
}
