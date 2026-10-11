import { useSyncExternalStore } from 'react'
import { getNetStatus, subscribeNet } from '../lib/netStatus'

/** Estado de la red: `{ online, slow, lastOnlineAt }` (se actualiza solo) */
export const useNetStatus = () => useSyncExternalStore(subscribeNet, getNetStatus, getNetStatus)

/** `true` si hay conexión */
export const useOnline = () => useNetStatus().online
