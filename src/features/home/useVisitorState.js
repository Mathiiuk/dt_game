import { useEffect, useState } from 'react'

// ¿Hay una sesión guardada en este navegador? Se mira el almacenamiento local antes de cargar nada:
// un visitante nuevo no descarga el cliente de la base ni hace ninguna consulta.
const hasStoredSession = () => {
  try {
    return Object.keys(window.localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
  } catch {
    return false
  }
}

/**
 * Estado de quien mira la portada: 'visitor' (sin sesión), 'no-career' (con sesión, sin DT) o 'career'.
 * Empieza siempre en 'visitor' para que la portada se vea igual para buscadores y para el primer render.
 */
export function useVisitorState() {
  const [state, setState] = useState('visitor')

  useEffect(() => {
    if (!hasStoredSession()) return
    let alive = true
    ;(async () => {
      try {
        const [{ authApi }, { managerApi }] = await Promise.all([import('../../api/auth'), import('../../api/manager')])
        const user = await authApi.getSession()
        if (!user || !alive) return
        const manager = await managerApi.getManager(user.id).catch(() => null)
        if (alive) setState(manager ? 'career' : 'no-career')
      } catch {
        // Ante cualquier problema la portada queda como para un visitante
      }
    })()
    return () => { alive = false }
  }, [])

  return state
}
