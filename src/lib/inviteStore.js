// El código de la invitación se guarda al llegar con el enlace: así sobrevive al registro y a crear el club antes de entrar a la sala
import { codeFromSearch } from '../domain/roomInvite'

const KEY = 'vestuario-invite'
const store = () => { try { return window.localStorage } catch { return null } }

export function capturePendingInvite(search, storage = store()) {
  const code = codeFromSearch(search)
  if (!code) return
  try { storage?.setItem(KEY, code) } catch { /* sin almacenamiento: se usa solo en esta visita */ }
}

export function getPendingInvite(storage = store()) {
  try { return codeFromSearch(`?codigo=${storage?.getItem(KEY) || ''}`) } catch { return '' }
}

export function clearPendingInvite(storage = store()) {
  try { storage?.removeItem(KEY) } catch { /* nada que limpiar */ }
}
