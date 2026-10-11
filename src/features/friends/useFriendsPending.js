import { useEffect, useState } from 'react'
import { friendsApi } from '../../api/friends'

const REFRESH_MS = 5 * 60 * 1000

/** Salas de amigos que esperan algo de mí (elegir planteo o ver una fecha jugada). Se consulta al entrar y cada tanto; si falla, no avisa nada. */
export function useFriendsPending(pathname, enabled = true) {
  const [pending, setPending] = useState([])
  useEffect(() => {
    if (!enabled) return undefined
    let alive = true
    const load = () => friendsApi.getPending().then(list => { if (alive) setPending(list) }).catch(() => {})
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => { alive = false; clearInterval(timer) }
  }, [pathname, enabled])
  return pending
}

/** Texto del aviso de una sala */
export const pendingText = (p) => (p.kind === 'PLAN' ? `Tu planteo de la fecha ${p.round} está pendiente en ${p.room_name}.` : `Se jugó la fecha ${p.round} en ${p.room_name}. Mirá cómo salió.`)
