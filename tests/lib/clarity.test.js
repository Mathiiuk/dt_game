import { CLARITY_ID, loadClarity, syncClarityConsent } from '../../src/lib/clarity'
import { CONSENT_KEY, setConsent, applyStoredConsent } from '../../src/lib/consent'

const clarityScripts = () => [...document.head.querySelectorAll('script')].filter(s => (s.src || '').includes('clarity.ms'))

describe('Microsoft Clarity (solo con consentimiento)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.dataLayer = []
    delete window.clarity
    document.head.innerHTML = '<script></script>'
  })

  it('el id del proyecto es el de Vestuario', () => {
    expect(CLARITY_ID).toBe('ywsirniaxt')
  })

  it('sin elección guardada no se carga nada', () => {
    applyStoredConsent()
    expect(clarityScripts()).toHaveLength(0)
    expect(window.clarity).toBeUndefined()
  })

  it('aceptar carga el script de Clarity una sola vez, con la dirección del fabricante y de forma asíncrona', () => {
    setConsent('granted')
    const scripts = clarityScripts()
    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toBe(`https://www.clarity.ms/tag/${CLARITY_ID}`)
    expect(scripts[0].async).toBe(true)
    setConsent('granted')
    loadClarity()
    expect(clarityScripts()).toHaveLength(1)
  })

  it('deja la función clarity lista con cola (como el código oficial) y avisa que hay consentimiento', () => {
    setConsent('granted')
    expect(typeof window.clarity).toBe('function')
    const calls = window.clarity.q.map(a => [...a])
    expect(calls).toContainEqual(['consentv2', { ad_Storage: 'granted', analytics_Storage: 'granted' }])
  })

  it('rechazar no carga nada', () => {
    setConsent('denied')
    expect(clarityScripts()).toHaveLength(0)
    expect(window.clarity).toBeUndefined()
  })

  it('si ya estaba cargado y se revoca el consentimiento, se le avisa a Clarity que queda denegado', () => {
    setConsent('granted')
    setConsent('denied')
    const calls = window.clarity.q.map(a => [...a])
    expect(calls.at(-1)).toEqual(['consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }])
    expect(clarityScripts()).toHaveLength(1)
  })

  it('al abrir la app con la aceptación guardada se carga; con el rechazo guardado, no', () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted')
    applyStoredConsent()
    expect(clarityScripts()).toHaveLength(1)
    document.head.innerHTML = '<script></script>'
    delete window.clarity
    window.localStorage.setItem(CONSENT_KEY, 'denied')
    applyStoredConsent()
    expect(clarityScripts()).toHaveLength(0)
  })

  it('una elección inválida no carga nada', () => {
    syncClarityConsent('quizas')
    setConsent('quizas')
    expect(clarityScripts()).toHaveLength(0)
  })

  it('no rompe si no hay documento (render del servidor)', () => {
    expect(() => syncClarityConsent('granted', { doc: null, win: null })).not.toThrow()
  })
})
