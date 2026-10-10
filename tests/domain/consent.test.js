import { CONSENT_KEY, consentSignals, getConsent, setConsent, applyStoredConsent } from '../../src/lib/consent'

const lastGtag = () => window.dataLayer.at(-1)

describe('consentimiento de cookies', () => {
  beforeEach(() => { window.localStorage.clear(); window.dataLayer = []; delete window.gtag })

  it('aceptar habilita medición y publicidad; rechazar deja todo denegado', () => {
    expect(consentSignals('granted')).toEqual({ ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })
    expect(Object.values(consentSignals('denied')).every(v => v === 'denied')).toBe(true)
  })

  it('sin elección guardada no hay respuesta todavía', () => {
    expect(getConsent()).toBeNull()
  })

  it('guardar la elección la recuerda y avisa a Google Tag Manager con "consent update"', () => {
    setConsent('granted')
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('granted')
    expect(getConsent()).toBe('granted')
    const entry = lastGtag()
    expect(entry[0]).toBe('consent')
    expect(entry[1]).toBe('update')
    expect(entry[2].analytics_storage).toBe('granted')
  })

  it('una elección inválida se ignora', () => {
    setConsent('quizas')
    expect(getConsent()).toBeNull()
    expect(window.dataLayer).toHaveLength(0)
  })

  it('al abrir la app se reaplica la elección guardada, y si no hay, no manda nada', () => {
    applyStoredConsent()
    expect(window.dataLayer).toHaveLength(0)
    window.localStorage.setItem(CONSENT_KEY, 'denied')
    applyStoredConsent()
    expect(lastGtag()[2].ad_storage).toBe('denied')
  })

  it('si el almacenamiento falla no rompe la app', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect(getConsent()).toBeNull()
    spy.mockRestore()
  })
})
