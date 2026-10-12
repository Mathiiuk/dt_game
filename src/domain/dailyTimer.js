/**
 * Contrarreloj del reto del día. El servidor es quien mide (el reloj arranca la primera vez que se abre el reto) y da el bonus:
 * +10 si se envía en 30 segundos o menos, +5 hasta el minuto, nada después. Acá solo se calcula lo que muestra la cuenta regresiva.
 */
const FAST = 30
const SLOW = 60

export function speedBonus(seconds) {
  const s = Number.isFinite(Number(seconds)) && Number(seconds) > 0 ? Math.floor(Number(seconds)) : 0
  if (s <= FAST) return { bonus: 10, remaining: FAST - s }
  if (s <= SLOW) return { bonus: 5, remaining: SLOW - s }
  return { bonus: 0, remaining: 0 }
}

/** El día anterior de una fecha AAAA-MM-DD (para la tabla de ayer); null si no es una fecha */
export function yesterdayOf(isoDay) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(isoDay || ''))) return null
  const date = new Date(`${isoDay}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}
