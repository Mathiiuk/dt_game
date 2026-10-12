// Consentimiento de cookies (Google Consent Mode v2). Por defecto todo está denegado (lo fija index.html antes de cargar Google Tag Manager)
// y recién se habilita si la persona acepta. La elección queda en este navegador; nunca viaja a la base de datos.

import { syncClarityConsent } from './clarity'

export const CONSENT_KEY = 'vestuario-consent'

const SIGNALS = ['ad_storage', 'analytics_storage', 'ad_user_data', 'ad_personalization']

export const consentSignals = (choice) => Object.fromEntries(SIGNALS.map(s => [s, choice === 'granted' ? 'granted' : 'denied']))

export function getConsent() {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

// gtag estándar: Google Tag Manager sólo reconoce `arguments`, no arreglos comunes
function gtag() {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(arguments)
}

export function setConsent(choice) {
  if (choice !== 'granted' && choice !== 'denied') return
  try { window.localStorage.setItem(CONSENT_KEY, choice) } catch { /* sin almacenamiento: vale para esta visita */ }
  gtag('consent', 'update', consentSignals(choice))
  syncClarityConsent(choice)
}

/** Al abrir la app: si ya había una elección, se la vuelve a informar a Google */
export function applyStoredConsent() {
  const choice = getConsent()
  if (choice) {
    gtag('consent', 'update', consentSignals(choice))
    syncClarityConsent(choice)
  }
}
