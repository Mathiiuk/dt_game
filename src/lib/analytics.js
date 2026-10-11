// Eventos de la parte pública. No hay proveedor contratado todavía: los eventos se dejan en `window.dataLayer`
// (formato estándar que leen Google Tag Manager y similares) para enchufar la herramienta sin tocar las pantallas.
// Nunca se envía información personal: sólo el nombre del evento y datos de navegación no sensibles.

export const LANDING_EVENTS = [
  'landing_view', 'login_click', 'register_click', 'continue_click', 'game_info_click',
  'tactics_click', 'market_click', 'career_click', 'faq_click', 'footer_click'
]

// Eventos del juego (sin datos personales): registro, club, temporada, Asamblea y liga de amigos
export const GAME_EVENTS = ['sign_up', 'club_created', 'season_closed', 'assembly_voted', 'friend_room_created', 'friend_room_joined', 'app_error', 'demo_start', 'demo_decision', 'demo_complete', 'demo_cta_click']

const ALLOWED = [...LANDING_EVENTS, ...GAME_EVENTS]

const SAFE_KEYS = ['placement', 'path']

export function track(event, params = {}) {
  if (typeof window === 'undefined' || !ALLOWED.includes(event)) return
  const safe = Object.fromEntries(Object.entries(params).filter(([key]) => SAFE_KEYS.includes(key)))
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...safe })
}
