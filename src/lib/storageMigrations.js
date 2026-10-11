// Versión de los datos que el juego guarda en este navegador (claves `vestuario-*`). Cuando una versión nueva cambia el formato de algo
// guardado, se agrega UNA migración con su número: corre una sola vez, en orden, y nunca borra claves que no conoce.
export const STORAGE_VERSION_KEY = 'vestuario-storage-version'

/** Una por versión. La 1 es la base de partida: marca los datos que ya existían sin cambiar nada. */
export const MIGRATIONS = [
  { to: 1, run: () => {} }
]

export const STORAGE_VERSION = MIGRATIONS.length

/**
 * Pone los datos guardados al día. Si un paso falla se omite y se sigue (jugar importa más que migrar); sin almacenamiento no hace nada.
 * Devuelve { from, to, applied, failed? }.
 */
export function runStorageMigrations(storage = typeof window !== 'undefined' ? window.localStorage : null, { migrations = MIGRATIONS, version = STORAGE_VERSION } = {}) {
  const none = { from: 0, to: 0, applied: [] }
  if (!storage) return none
  let raw
  try { raw = Number.parseInt(storage.getItem(STORAGE_VERSION_KEY), 10) } catch { return none }
  const from = Number.isFinite(raw) && raw > 0 ? raw : 0
  const applied = []
  const failed = []
  for (const step of [...migrations].sort((a, b) => a.to - b.to)) {
    if (step.to <= from || step.to > version) continue
    try { step.run(storage); applied.push(step.to) } catch { failed.push(step.to) }
  }
  try { storage.setItem(STORAGE_VERSION_KEY, String(Math.max(from, version))) } catch { /* sin almacenamiento: se reintenta la próxima vez */ }
  return failed.length ? { from, to: Math.max(from, version), applied, failed } : { from, to: Math.max(from, version), applied }
}
