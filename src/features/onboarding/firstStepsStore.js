// Lo que cada persona ya hizo de la misión inicial. Vive en este navegador (por usuario): es una ayuda, no un dato de la partida.
const key = (userId) => `vestuario-first-steps:${userId}`

export function readSteps(userId) {
  if (!userId) return {}
  try { return JSON.parse(window.localStorage.getItem(key(userId)) || '{}') || {} } catch { return {} }
}

/** Anota un paso hecho (tactics, decision) o la misión oculta (dismissed); devuelve lo guardado */
export function markStep(userId, step) {
  if (!userId) return {}
  const next = { ...readSteps(userId), [step]: true }
  try { window.localStorage.setItem(key(userId), JSON.stringify(next)) } catch { /* sin almacenamiento: el paso no se recuerda */ }
  try { window.dispatchEvent(new Event('vestuario:first-steps')) } catch { /* sin eventos */ }
  return next
}
