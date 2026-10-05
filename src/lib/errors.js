/**
 * Mensajes de error pensados para el jugador: castellano rioplatense, sin códigos ni detalles técnicos.
 * `friendlyError(error, fallback)` devuelve el texto para mostrar; el detalle crudo se deja en la consola.
 */

// Mensaje de dominio: "ERR_CODIGO: texto para el jugador" -> "texto para el jugador"
const DOMAIN_PREFIX = /^ERR_[A-Z0-9_]+:\s*/

// Errores conocidos de la base (PostgREST / Postgres) -> mensaje humano
const KNOWN = [
  [/could not find the '?[\w]+'? column/i, 'No pudimos guardar los datos: falta actualizar la base. Avisá al equipo.'],
  [/null value in column "?[\w]+"?/i, 'Faltan datos obligatorios para completar la acción.'],
  [/violates (unique|foreign key|check) constraint/i, 'Esa acción ya estaba registrada o choca con otros datos.'],
  [/duplicate key value/i, 'Eso ya estaba registrado.'],
  [/permission denied|row-level security|not authorized|jwt/i, 'No tenés permiso para hacer esto.'],
  [/failed to fetch|networkerror|load failed|network request failed/i, 'No pudimos conectarnos. Revisá tu internet y probá de nuevo.'],
  [/timeout|timed out/i, 'Tardó demasiado en responder. Probá de nuevo.']
]

const GENERIC = 'Algo salió mal. Probá de nuevo en un momento.'

/** ¿El texto parece escrito para el jugador (castellano, sin jerga técnica)? */
const looksHuman = (text) => /[áéíóúñ¿¡]|\b(el|la|los|las|no|tu|tenés|podés|necesitás|ya|del|para|con|por)\b/i.test(text) && !/\b(column|constraint|relation|schema|violates|undefined|null value|syntax)\b/i.test(text)

export const friendlyError = (error, fallback = GENERIC) => {
  const raw = typeof error === 'string' ? error : error?.message || ''
  if (!raw) return fallback

  if (DOMAIN_PREFIX.test(raw)) return raw.replace(DOMAIN_PREFIX, '')

  for (const [pattern, message] of KNOWN) if (pattern.test(raw)) return message

  return looksHuman(raw) ? raw : fallback
}
