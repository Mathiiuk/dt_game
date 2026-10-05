import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const register = vi.fn(async ({ name }) => ({ user: { name } }))
const login = vi.fn(async () => ({ user: { name: 'DT' } }))
const requestPasswordReset = vi.fn(async () => ({ message: 'ok' }))
const navigate = vi.fn()

vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))
vi.mock('../../src/api/auth', () => ({
  authApi: { register: (...a) => register(...a), login: (...a) => login(...a), requestPasswordReset: (...a) => requestPasswordReset(...a) },
  checkRateLimit: vi.fn(() => ({ locked: false, remainingAttempts: 5 })),
  validatePasswordStrength: (p) => ({
    hasLength: p.length >= 8, hasNumber: /\d/.test(p), hasUpperOrSymbol: /[A-Z\W]/.test(p),
    valid: p.length >= 8 && /\d/.test(p) && /[A-Z\W]/.test(p), errors: ['Contraseña débil']
  })
}))

import AuthScreen from '../../src/features/auth/AuthScreen'

const renderScreen = () => render(<MemoryRouter><AuthScreen /></MemoryRouter>)

describe('pantalla de acceso', () => {
  beforeEach(() => { register.mockClear(); login.mockClear(); navigate.mockClear(); requestPasswordReset.mockClear() })

  it('la bienvenida lleva a registrarse o a continuar la carrera', async () => {
    renderScreen()
    expect(screen.getByRole('heading', { level: 1, name: 'Del Potrero' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Continuar carrera/ }))
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('iniciar sesión valida con la API y navega al juego', async () => {
    renderScreen()
    await userEvent.click(screen.getByRole('button', { name: /Continuar carrera/ }))
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'dt@potrero.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Secreta123')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar al banquillo' }))
    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'dt@potrero.com', password: 'Secreta123' }))
    expect(navigate).toHaveBeenCalledWith('/game')
  })

  it('al registrarse marca requisitos y muestra el error de contraseñas distintas junto al campo', async () => {
    renderScreen()
    await userEvent.click(screen.getByRole('button', { name: /Nueva carrera/ }))
    await userEvent.type(screen.getByLabelText('Contraseña'), 'abc')
    expect(screen.getByText(/Mínimo 8 caracteres/)).toHaveTextContent('(pendiente)')
    await userEvent.clear(screen.getByLabelText('Contraseña'))
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Secreta123')
    expect(screen.getByText(/Mínimo 8 caracteres/)).toHaveTextContent('(cumplido)')

    await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'Otra')
    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.')
    expect(register).not.toHaveBeenCalled()
  })

  it('el botón del ojo alterna la visibilidad de la contraseña', async () => {
    renderScreen()
    await userEvent.click(screen.getByRole('button', { name: /Continuar carrera/ }))
    const field = screen.getByLabelText('Contraseña')
    expect(field).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(field).toHaveAttribute('type', 'text')
  })

  it('recuperar contraseña envía el correo y confirma', async () => {
    renderScreen()
    await userEvent.click(screen.getByRole('button', { name: /Continuar carrera/ }))
    await userEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }))
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'dt@potrero.com')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))
    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith('dt@potrero.com'))
    expect(await screen.findByRole('status')).toHaveTextContent('Solicitud procesada')
  })
})
