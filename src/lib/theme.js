// Tema de la interfaz: claro ("papel"), oscuro ("noche de redacción") o automático (el del sistema).
// La preferencia se guarda en este dispositivo. El mismo cálculo corre en `index.html` ANTES de pintar (para que no parpadee);
// tests/static/themeBoot.test.js comprueba que ambos coinciden.
import { useCallback, useEffect, useState } from 'react'

export const THEME_KEY = 'vestuario-theme'
export const THEME_PREFS = ['auto', 'light', 'dark']
export const THEME_COLORS = { light: '#F5EFE0', dark: '#101521' }
// Por defecto es claro para todos (la elección guardada de cada persona se respeta); se cambia en Ajustes (escritorio) o en Más → Apariencia (celular)
export const DEFAULT_THEME = 'light'

const validPref = (v) => (THEME_PREFS.includes(v) ? v : DEFAULT_THEME)
const defaultStorage = () => { try { return window.localStorage } catch { return null } }

/** Preferencia guardada (la de por defecto si no hay, es inválida o el almacenamiento está bloqueado) */
export function getStoredTheme(storage = defaultStorage()) {
  try { return validPref(storage?.getItem(THEME_KEY)) } catch { return DEFAULT_THEME }
}

/** 'light' | 'dark' según la preferencia y, en automático, el sistema */
export const resolveTheme = (pref, prefersDark) => (validPref(pref) === 'auto' ? (prefersDark ? 'dark' : 'light') : validPref(pref))

const systemPrefersDark = (matchMedia) => {
  try { return Boolean(matchMedia?.('(prefers-color-scheme: dark)')?.matches) } catch { return false }
}

/** Fija el tema en el documento (atributo, esquema de color y color de la barra del navegador). Devuelve el tema resuelto. */
export function applyTheme(pref, { doc = typeof document === 'undefined' ? null : document, matchMedia = typeof window === 'undefined' ? null : window.matchMedia?.bind(window) } = {}) {
  const resolved = resolveTheme(pref, systemPrefersDark(matchMedia))
  if (doc?.documentElement) {
    doc.documentElement.dataset.theme = resolved
    doc.documentElement.style.colorScheme = resolved
    const meta = doc.querySelector?.('meta[name="theme-color"]')
    if (meta) meta.content = THEME_COLORS[resolved]
  }
  return resolved
}

/** Guarda la preferencia (si se puede) y la aplica */
export function setTheme(pref, { storage = defaultStorage(), ...env } = {}) {
  const value = validPref(pref)
  try { storage?.setItem(THEME_KEY, value) } catch { /* sin almacenamiento: vale solo para esta sesión */ }
  return applyTheme(value, env)
}

/** { pref, resolved, setPref }: en automático se actualiza solo cuando el sistema cambia de tema */
export function useTheme() {
  const [pref, setPrefState] = useState(() => getStoredTheme())
  const [resolved, setResolved] = useState(() => (typeof document === 'undefined' ? 'light' : (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')))

  useEffect(() => {
    if (pref !== 'auto' || typeof window === 'undefined' || !window.matchMedia) return undefined
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(applyTheme('auto'))
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [pref])

  const setPref = useCallback((next) => { setPrefState(validPref(next)); setResolved(setTheme(next)) }, [])
  return { pref, resolved, setPref }
}
