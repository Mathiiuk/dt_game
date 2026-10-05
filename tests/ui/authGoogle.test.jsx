import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const state = { recaptcha: false }
const register = vi.fn(async ({ name }) => ({ user: { name }, token: 'abc' }))
const loginWithGoogle = vi.fn(async () => {})
const navigate = vi.fn()
const loadRecaptcha = vi.fn(async () => null)

vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))
vi.mock('../../src/lib/recaptcha', () => ({ isRecaptchaEnabled: () => state.recaptcha, loadRecaptcha: (...a) => loadRecaptcha(...a) }))
vi.mock('../../src/api/auth', () => ({
  authApi: { register: (...a) => register(...a), loginWithGoogle: (...a) => loginWithGoogle(...a), login: vi.fn(), requestPasswordReset: vi.fn() },
  checkRateLimit: vi.fn(() => ({ locked: false, remainingAttempts: 5 })),
  validatePasswordStrength: (p) => ({
    hasLength: p.length >= 8, hasNumber: /\d/.test(p), hasUpperOrSymbol: /[A-Z\W]/.test(p),
    valid: p.length >= 8 && /\d/.test(p) && /[A-Z\W]/.test(p), errors: ['Contraseña débil']
  })
}))

import AuthScreen from '../../src/features/auth/AuthScreen'
import { toast } from 'sonner'

const renderMode = (mode) => render(<MemoryRouter><AuthScreen initialMode={mode} /></MemoryRouter>)

describe('ingreso con Google y reCAPTCHA', () => {
  beforeEach(() => {
    state.recaptcha = false
    register.mockClear()
    loginWithGoogle.mockClear()
    navigate.mockClear()
    loadRecaptcha.mockClear()
    toast.success.mockClear()
    toast.error.mockClear()
  })

  it('el inicio de sesión ofrece continuar con Google', async () => {
    renderMode('login')
    await userEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))
    expect(loginWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('el alta también ofrece Google', () => {
    renderMode('register')
    expect(screen.getByRole('button', { name: /Continuar con Google/ })).toBeInTheDocument()
  })

  it('si Google falla se avisa y el botón vuelve a estar disponible', async () => {
    loginWithGoogle.mockRejectedValueOnce(new Error('provider is not enabled'))
    renderMode('login')
    const button = screen.getByRole('button', { name: /Continuar con Google/ })
    await userEvent.click(button)
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /Continuar con Google/ })).toBeEnabled()
  })

  it('con reCAPTCHA configurado muestra el aviso de Google y carga el script al abrir el formulario', () => {
    state.recaptcha = true
    renderMode('login')
    expect(screen.getByText(/protegido por reCAPTCHA/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Política de privacidad/ })).toHaveAttribute('href', 'https://policies.google.com/privacy')
    expect(loadRecaptcha).toHaveBeenCalled()
  })

  it('sin reCAPTCHA no muestra el aviso ni carga nada', () => {
    renderMode('login')
    expect(screen.queryByText(/protegido por reCAPTCHA/)).not.toBeInTheDocument()
    expect(loadRecaptcha).not.toHaveBeenCalled()
  })

  it('si la cuenta pide confirmar el correo, avisa y vuelve al ingreso en vez de seguir', async () => {
    register.mockResolvedValueOnce({ user: { name: 'Nuevo' } })
    renderMode('register')
    await userEvent.type(screen.getByLabelText('Nombre de entrenador'), 'Nuevo')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'nuevo@dt.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Potrero2026')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'Potrero2026')
    await userEvent.click(screen.getByRole('button', { name: /Registrar y comenzar carrera/ }))
    await waitFor(() => expect(register).toHaveBeenCalled())
    expect(navigate).not.toHaveBeenCalled()
    expect(toast.success.mock.calls[0][0]).toMatch(/correo para confirmar/)
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('con sesión, el alta sigue a crear al DT', async () => {
    renderMode('register')
    await userEvent.type(screen.getByLabelText('Nombre de entrenador'), 'Nuevo')
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'nuevo@dt.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Potrero2026')
    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'Potrero2026')
    await userEvent.click(screen.getByRole('button', { name: /Registrar y comenzar carrera/ }))
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/create-manager'))
  })
})
