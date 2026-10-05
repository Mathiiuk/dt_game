// Eventos de la parte pública. No hay proveedor contratado todavía: los eventos se dejan en `window.dataLayer`
// (formato estándar que leen Google Tag Manager y similares) para enchufar la herramienta sin tocar las pantallas.
// Nunca se envía información personal: sólo el nombre del evento y datos de navegación no sensibles.

export const LANDING_EVENTS = [
  'landing_view', 'login_click', 'register_click', 'continue_click', 'game_info_click',
  'tactics_click', 'market_click', 'career_click', 'faq_click', 'footer_click'
]

const SAFE_KEYS = ['placement', 'path']

export function track(event, params = {}) {
  if (typeof window === 'undefined' || !LANDING_EVENTS.includes(event)) return
  const safe = Object.fromEntries(Object.entries(params).filter(([key]) => SAFE_KEYS.includes(key)))
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...safe })
}
