// authApi con reCAPTCHA: alta, ingreso y recuperar clave pasan por la función del servidor
const state = { enabled: true, invoke: null, calls: [], setSession: vi.fn(async () => ({ error: null })) }

vi.mock('../../src/lib/recaptcha', () => ({
  isRecaptchaEnabled: () => state.enabled,
  getRecaptchaToken: vi.fn(async (action) => `token-${action}-${'x'.repeat(30)}`)
}))

vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async () => {}) } }))

vi.mock('../../src/api/supabase', () => {
  const chain = () => {
    const q = {}
    q.select = () => q
    q.eq = () => q
    q.order = () => q
    q.limit = () => q
    q.insert = () => q
    q.update = () => q
    q.single = async () => ({ data: { id: 'career1' } })
    q.maybeSingle = async () => ({ data: { id: 'career1' } })
    q.then = (resolve) => resolve({ data: null, error: null })
    return q
  }
  return {
    supabase: {
      from: chain,
      functions: { invoke: (...a) => { state.calls.push(a); return state.invoke(...a) } },
      auth: {
        setSession: (...a) => state.setSession(...a),
        signUp: vi.fn(async () => ({ data: { user: { id: 'u1', email: 'a@b.co', user_metadata: { display_name: 'Direct' } }, session: { access_token: 't' } }, error: null })),
        signInWithPassword: vi.fn(async () => ({ data: { user: { id: 'u1', email: 'a@b.co', user_metadata: {} }, session: { access_token: 't' } }, error: null })),
        signInWithOAuth: vi.fn(async () => ({ error: null })),
        resetPasswordForEmail: vi.fn(async () => ({ error: null })),
        getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u1', email: 'g@b.co', user_metadata: { full_name: 'Gabi Google' } }, expires_at: 1 } }, error: null }))
      }
    }
  }
})

import { authApi } from '../../src/api/auth'
import { supabase } from '../../src/api/supabase'

const okSession = { access_token: 'acc', refresh_token: 'ref' }

describe('puerta de entrada con reCAPTCHA', () => {
  beforeEach(() => {
    state.enabled = true
    state.calls = []
    state.setSession = vi.fn(async () => ({ error: null }))
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('el ingreso va por la función con un token de la acción "login" y deja la sesión puesta', async () => {
    state.invoke = async () => ({ data: { ok: true, user: { id: 'u1', email: 'a@b.co', user_metadata: { display_name: 'Marcelo' } }, session: okSession }, error: null })
    const res = await authApi.login({ email: ' A@B.co ', password: 'Potrero2026' })
    const [fn, opts] = state.calls[0]
    expect(fn).toBe('auth-gate')
    expect(opts.body).toMatchObject({ action: 'login', email: 'a@b.co', password: 'Potrero2026' })
    expect(opts.body.captchaToken).toMatch(/^token-login-/)
    expect(state.setSession).toHaveBeenCalledWith(okSession)
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
    expect(res.user.email).toBe('a@b.co')
  })

  it('si el servidor rechaza, el ingreso falla y cuenta como intento fallido', async () => {
    state.invoke = async () => ({
      data: null,
      error: { context: { json: async () => ({ message: 'No pudimos verificar que sos una persona.' }) } }
    })
    await expect(authApi.login({ email: 'a@b.co', password: 'mala' })).rejects.toThrow(/Credenciales incorrectas/)
  })

  it('el alta pide un token de "signup" y manda el nombre', async () => {
    state.invoke = async () => ({
      data: { ok: true, user: { id: 'u2', email: 'n@b.co', user_metadata: { display_name: 'Nueva' } }, session: okSession, needsConfirmation: false },
      error: null
    })
    const res = await authApi.register({ name: 'Nueva', email: 'n@b.co', password: 'Potrero2026' })
    expect(state.calls[0][1].body).toMatchObject({ action: 'signup', name: 'Nueva' })
    expect(state.calls[0][1].body.captchaToken).toMatch(/^token-signup-/)
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
    expect(res.user.name).toBe('Nueva')
    expect(res.token).toBe('acc')
  })

  it('si la cuenta pide confirmar el correo, el alta no devuelve sesión', async () => {
    state.invoke = async () => ({ data: { ok: true, user: { id: 'u3', email: 'c@b.co', user_metadata: {} }, session: null, needsConfirmation: true }, error: null })
    const res = await authApi.register({ name: 'Sin Sesión', email: 'c@b.co', password: 'Potrero2026' })
    expect(res.token).toBeUndefined()
    expect(state.setSession).not.toHaveBeenCalled()
  })

  it('recuperar la clave pasa por la función y no revela si la cuenta existe', async () => {
    state.invoke = async () => ({ data: { ok: true }, error: null })
    const res = await authApi.requestPasswordReset('alguien@b.co')
    expect(state.calls[0][1].body).toMatchObject({ action: 'reset', email: 'alguien@b.co' })
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled()
    expect(res.message).toBeTruthy()
  })

  it('una contraseña débil se rechaza antes de llamar al servidor', async () => {
    await expect(authApi.register({ name: 'X', email: 'x@b.co', password: 'abc' })).rejects.toThrow(/8 caracteres/)
    expect(state.calls).toHaveLength(0)
  })
})

describe('sin reCAPTCHA configurado (desarrollo)', () => {
  beforeEach(() => { state.enabled = false; state.calls = []; vi.clearAllMocks(); localStorage.clear() })

  it('usa el camino directo de Supabase', async () => {
    await authApi.login({ email: 'a@b.co', password: 'Potrero2026' })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'Potrero2026' })
    expect(state.calls).toHaveLength(0)
  })

  it('el alta directa manda el nombre como display_name', async () => {
    await authApi.register({ name: 'Directo', email: 'd@b.co', password: 'Potrero2026' })
    expect(supabase.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: { data: { display_name: 'Directo' } } }))
  })
})

describe('Google', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inicia el ingreso con Google y vuelve a /game', async () => {
    await authApi.loginWithGoogle()
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: `${window.location.origin}/game` } })
  })

  it('un error de Google se informa', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValueOnce({ error: { message: 'provider is not enabled' } })
    await expect(authApi.loginWithGoogle()).rejects.toThrow(/provider is not enabled/)
  })

  it('al volver de Google la sesión toma el nombre de la cuenta y asegura la carrera', async () => {
    const session = await authApi.getSession()
    expect(session.name).toBe('Gabi Google')
    expect(session.careerId).toBe('career1')
  })
})
