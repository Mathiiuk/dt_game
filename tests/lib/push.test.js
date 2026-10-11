const rpc = vi.fn()
const invoke = vi.fn()
const selectRows = { rows: [] }
vi.mock('../../src/api/supabase', () => ({
  supabase: {
    rpc: (...a) => rpc(...a),
    functions: { invoke: (...a) => invoke(...a) },
    from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: selectRows.rows, error: null }) }) })
  }
}))

import { pushSupport, urlBase64ToUint8Array, pushStatus, enablePush, disablePush, getPrefs, setPrefs, sendTestPush } from '../../src/lib/push'

const fakeSub = { endpoint: 'https://push.example/abc', toJSON: () => ({ endpoint: 'https://push.example/abc', keys: { p256dh: 'P', auth: 'A' } }), unsubscribe: vi.fn().mockResolvedValue(true) }
const setup = ({ permission = 'default', existing = null, request = 'granted' } = {}) => {
  const pushManager = { getSubscription: vi.fn().mockResolvedValue(existing), subscribe: vi.fn().mockResolvedValue(fakeSub) }
  Object.defineProperty(navigator, 'serviceWorker', { value: { ready: Promise.resolve({ pushManager }) }, configurable: true })
  window.PushManager = function PushManager() {}
  window.Notification = { permission, requestPermission: vi.fn().mockResolvedValue(request) }
  return pushManager
}

describe('avisos push en el navegador', () => {
  beforeEach(() => { rpc.mockReset(); invoke.mockReset(); fakeSub.unsubscribe.mockClear(); selectRows.rows = [] })

  it('detecta si el navegador los permite, y en iPhone sin instalar explica qué falta', () => {
    setup()
    expect(pushSupport()).toEqual({ supported: true })
    const iphone = { navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }, matchMedia: () => ({ matches: false }) }
    expect(pushSupport(iphone)).toEqual({ supported: false, reason: 'ios-install' })
    expect(pushSupport({ ...iphone, matchMedia: () => ({ matches: true }) })).toEqual({ supported: false, reason: 'unsupported' })
    expect(pushSupport({ navigator: { userAgent: 'Linux' } })).toEqual({ supported: false, reason: 'unsupported' })
    expect(pushSupport(null)).toEqual({ supported: false, reason: 'no-window' })
  })

  it('convierte la clave pública a bytes', () => {
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3])
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255])
  })

  it('estado: bloqueado, apagado o encendido', async () => {
    setup({ permission: 'denied' })
    expect(await pushStatus()).toEqual({ state: 'blocked' })
    setup({ permission: 'default' })
    expect(await pushStatus()).toEqual({ state: 'off' })
    setup({ permission: 'granted', existing: fakeSub })
    expect(await pushStatus()).toEqual({ state: 'on' })
  })

  it('activar: pide permiso, se suscribe con la clave del servidor y guarda el dispositivo en la cuenta', async () => {
    const pm = setup()
    rpc.mockImplementation(async (name) => (name === 'push_public_key' ? { data: 'AQID', error: null } : { data: null, error: null }))
    expect(await enablePush()).toBe('on')
    expect(pm.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) })
    expect(rpc).toHaveBeenCalledWith('push_subscribe', expect.objectContaining({ p_endpoint: 'https://push.example/abc', p_p256dh: 'P', p_auth: 'A' }))
  })

  it('si la persona rechaza el permiso no se guarda nada', async () => {
    setup({ request: 'denied' })
    expect(await enablePush()).toBe('blocked')
    expect(rpc).not.toHaveBeenCalled()
    setup({ request: 'default' })
    expect(await enablePush()).toBe('off')
  })

  it('si el servidor todavía no tiene clave, no se suscribe', async () => {
    const pm = setup()
    rpc.mockResolvedValue({ data: null, error: null })
    expect(await enablePush()).toBe('unavailable')
    expect(pm.subscribe).not.toHaveBeenCalled()
  })

  it('apagar borra la suscripción de la cuenta y del navegador', async () => {
    setup({ existing: fakeSub })
    rpc.mockResolvedValue({ data: null, error: null })
    await disablePush()
    expect(rpc).toHaveBeenCalledWith('push_unsubscribe', { p_endpoint: 'https://push.example/abc' })
    expect(fakeSub.unsubscribe).toHaveBeenCalled()
  })

  it('preferencias: por defecto todo encendido; guardar manda los tres tipos', async () => {
    expect(await getPrefs('u1')).toEqual({ friends: true, club: true, news: true })
    selectRows.rows = [{ friends: true, club: false, news: true }]
    expect(await getPrefs('u1')).toEqual({ friends: true, club: false, news: true })
    rpc.mockResolvedValue({ data: null, error: null })
    await setPrefs({ friends: false, club: true, news: false })
    expect(rpc).toHaveBeenCalledWith('push_set_prefs', { p_friends: false, p_club: true, p_news: false })
  })

  it('el aviso de prueba pasa por la función del servidor', async () => {
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
    expect(await sendTestPush()).toBe(true)
    expect(invoke).toHaveBeenCalledWith('push-dispatch', { body: { action: 'test' } })
    invoke.mockResolvedValue({ data: null, error: new Error('x') })
    await expect(sendTestPush()).rejects.toThrow()
  })
})
