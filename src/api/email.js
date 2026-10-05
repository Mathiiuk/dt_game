import { supabase } from './supabase'

/**
 * Correos del juego (Resend, desde la función `send-email`). Nunca frenan lo que está haciendo la persona:
 * si el servicio no está disponible, se registra el aviso y se sigue.
 */
export const emailApi = {
  /** Bienvenida a la cuenta: sale una sola vez, al correo de quien tiene la sesión iniciada */
  async sendWelcome() {
    try {
      const { error } = await supabase.functions.invoke('send-email', { body: { template: 'welcome' } })
      if (error) console.warn('Aviso: no se pudo enviar el correo de bienvenida:', error.message)
    } catch (e) {
      console.warn('Aviso: no se pudo enviar el correo de bienvenida:', e)
    }
  }
}
