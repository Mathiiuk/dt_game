/** Utilidades de formato compartidas (fechas del juego y dinero) */

const toUtcDate = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1))
}

/** "2026-08-12" -> "mié 12 ago 2026" (sin desfase de zona horaria) */
export const formatGameDate = (iso) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(toUtcDate(iso))
}

/** "2026-08-12" -> "miércoles 12 de agosto" */
export const formatLongDate = (iso) => {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(toUtcDate(iso))
}

/** Días enteros entre dos fechas ISO (negativo si `to` es anterior) */
export const daysBetween = (fromIso, toIso) =>
  Math.round((toUtcDate(toIso) - toUtcDate(fromIso)) / 86_400_000)

/** 94916 -> "$94.916"; negativos con signo delante: "-$1.200" */
export const formatMoney = (value) => {
  const n = Number(value) || 0
  const abs = Math.abs(Math.round(n)).toLocaleString('es-AR')
  return `${n < 0 ? '-' : ''}$${abs}`
}
