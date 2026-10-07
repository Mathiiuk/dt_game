/**
 * Pide confirmación de un aviso de riesgo (ver domain/warnings) antes de una acción.
 * `getWarning` calcula el aviso (puede consultar datos). Un aviso nunca debe bloquear la acción:
 * si no se puede calcular, la acción sigue. Devuelve true si hay que seguir.
 */
export async function askRisk(confirmRisk, getWarning) {
  if (typeof confirmRisk !== 'function') return true
  let warning
  try {
    warning = await getWarning()
  } catch (e) {
    console.warn('Aviso: no se pudo calcular el aviso previo:', e)
    return true
  }
  return warning ? confirmRisk(warning) : true
}
