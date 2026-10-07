import { toast } from 'sonner'
import { authApi } from '../../api/auth'
import { useGameContext } from '../../context/GameContext'
import { friendlyError } from '../../lib/errors'
import { hardRedirect } from '../../lib/redirect'

/**
 * Cierre de sesión con confirmación. Al salir se recarga la app en la portada: así no queda nada del club
 * anterior en memoria si después entra otra cuenta en el mismo navegador.
 */
export function useLogout() {
  const { confirmAction } = useGameContext()

  return async () => {
    const confirmed = await confirmAction({
      title: 'Cerrar sesión',
      description: 'Tu carrera queda guardada. Para seguir jugando vas a tener que ingresar de nuevo.',
      confirmText: 'Cerrar sesión',
      cancelText: 'Seguir jugando'
    })
    if (!confirmed) return
    try {
      await authApi.logout()
      hardRedirect('/')
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos cerrar la sesión. Probá de nuevo.'))
    }
  }
}
