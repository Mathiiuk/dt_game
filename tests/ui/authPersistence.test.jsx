import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock supabase client
const mockGetSession = vi.fn()
const mockRefreshSession = vi.fn()
const mockStartAutoRefresh = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFrom = vi.fn()

vi.mock('../../src/api/supabase', () => ({
  AUTH_STORAGE_KEY: 'dt_supabase_auth_token',
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      refreshSession: (...args) => mockRefreshSession(...args),
      startAutoRefresh: (...args) => mockStartAutoRefresh(...args),
      signOut: (...args) => mockSignOut(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args)
    },
    from: (...args) => mockFrom(...args)
  }
}))

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig()),
  useNavigate: () => navigate
}))

import { authApi, setupSessionVisibilityListener, DT_LAST_USER_KEY } from '../../src/api/auth'
import AuthScreen from '../../src/features/auth/AuthScreen'

describe('persistencia de sesión PWA y navegación de retroceso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    navigate.mockClear()
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'c-123' } }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('setupSessionVisibilityListener suscribe y reanuda auto-refresh al pasar a visible', async () => {
    const callback = vi.fn()
    const cleanup = setupSessionVisibilityListener(callback)

    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u-1', email: 'dt@test.com' } } },
      error: null
    })

    // Simular que la PWA vuelve a estar en primer plano
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => {
      expect(mockStartAutoRefresh).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ id: 'u-1' })
      }))
    })

    cleanup()
  })

  it('setupSessionVisibilityListener intenta refreshSession si getSession devuelve null en frío', async () => {
    const callback = vi.fn()
    const cleanup = setupSessionVisibilityListener(callback)

    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: { user: { id: 'u-refreshed', email: 'refreshed@test.com' } } },
      error: null
    })

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    window.dispatchEvent(new Event('focus'))

    await waitFor(() => {
      expect(mockRefreshSession).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ id: 'u-refreshed' })
      }))
    })

    cleanup()
  })

  it('authApi.getSession reintenta proactivamente con refreshSession si el token expiró', async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null }, error: new Error('JWT expired') })
    mockRefreshSession.mockResolvedValueOnce({
      data: {
        session: {
          user: { id: 'u-persisted', email: 'persisted@test.com', user_metadata: { display_name: 'Bielsa' } },
          expires_at: 1893456000
        }
      },
      error: null
    })

    const session = await authApi.getSession()

    expect(mockRefreshSession).toHaveBeenCalled()
    expect(session).toEqual(expect.objectContaining({
      id: 'u-persisted',
      name: 'Bielsa',
      email: 'persisted@test.com'
    }))

    const storedUser = JSON.parse(localStorage.getItem(DT_LAST_USER_KEY))
    expect(storedUser).toEqual({
      id: 'u-persisted',
      email: 'persisted@test.com',
      name: 'Bielsa'
    })
  })

  it('authApi.logout limpia los datos cacheados de sesión en localStorage', async () => {
    localStorage.setItem(DT_LAST_USER_KEY, JSON.stringify({ id: 'u-temp' }))
    mockGetSession.mockResolvedValueOnce({ data: { session: null } })
    mockSignOut.mockResolvedValueOnce({ error: null })

    await authApi.logout()

    expect(localStorage.getItem(DT_LAST_USER_KEY)).toBeNull()
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('AuthScreen redirige inmediatamente a /dashboard con replace: true si el usuario ya tiene sesión', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u-active', email: 'dt@club.com', user_metadata: { display_name: 'Gallardo' } }
        }
      },
      error: null
    })

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <AuthScreen />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })
})
