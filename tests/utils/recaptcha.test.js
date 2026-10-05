import { loadRecaptcha, getRecaptchaToken, isRecaptchaEnabled, recaptchaSiteKey } from '../../src/lib/recaptcha'

describe('reCAPTCHA v3 en el navegador', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    document.getElementById('recaptcha-v3-script')?.remove()
    delete window.grecaptcha
  })

  it('sin clave del sitio no hace nada y no pide token', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', '')
    expect(isRecaptchaEnabled()).toBe(false)
    expect(await loadRecaptcha()).toBeNull()
    expect(await getRecaptchaToken('login')).toBeNull()
    expect(document.getElementById('recaptcha-v3-script')).toBeNull()
  })

  it('con clave, usa Google ya cargado y pide el token de la acción', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'sitio-publico-123')
    expect(recaptchaSiteKey()).toBe('sitio-publico-123')
    const execute = vi.fn(async () => 'el-token')
    window.grecaptcha = { execute, ready: (cb) => cb() }
    const token = await getRecaptchaToken('signup')
    expect(token).toBe('el-token')
    expect(execute).toHaveBeenCalledWith('sitio-publico-123', { action: 'signup' })
  })

  it('agrega la etiqueta del script una sola vez aunque se pida varias veces', async () => {
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', 'sitio-publico-123')
    const first = loadRecaptcha()
    const second = loadRecaptcha()
    expect(document.querySelectorAll('#recaptcha-v3-script')).toHaveLength(1)
    expect(document.getElementById('recaptcha-v3-script').src).toContain('render=sitio-publico-123')
    window.grecaptcha = { execute: vi.fn(), ready: (cb) => cb() }
    document.getElementById('recaptcha-v3-script').dispatchEvent(new Event('load'))
    await expect(first).resolves.toBe(window.grecaptcha)
    await expect(second).resolves.toBe(window.grecaptcha)
  })
})
