import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
  clear: vi.fn()
}))

vi.mock('../../src/api/supabase', () => ({
  supabase: { functions: { invoke: mocks.invoke }, auth: { signOut: mocks.signOut, getSession: vi.fn(async () => ({ data: { session: null } })) }, from: vi.fn() }
}))
vi.mock('../../src/utils/cache', () => ({ queryCache: { clear: mocks.clear, fetch: vi.fn() } }))

import { authApi, DT_LAST_USER_KEY } from '../../src/api/auth'

describe('authApi.deleteAccount', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.setItem(DT_LAST_USER_KEY, '{"x":1}'); sessionStorage.setItem('k', 'v') })

  it('llama a la función del servidor y limpia lo que quedó en el dispositivo', async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: true, deleted: 12 }, error: null })
    const res = await authApi.deleteAccount('ELIMINAR')
    expect(mocks.invoke).toHaveBeenCalledWith('delete-account', { body: { confirm: 'ELIMINAR' } })
    expect(res.deleted).toBe(12)
    expect(localStorage.getItem(DT_LAST_USER_KEY)).toBeNull()
    expect(sessionStorage.getItem('k')).toBeNull()
    expect(mocks.clear).toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('si el servidor responde con error muestra el motivo y no limpia nada', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { context: { json: async () => ({ message: 'Quedaron datos sin borrar.' }) } } })
    await expect(authApi.deleteAccount('ELIMINAR')).rejects.toThrow('Quedaron datos sin borrar.')
    expect(localStorage.getItem(DT_LAST_USER_KEY)).not.toBeNull()
    expect(mocks.signOut).not.toHaveBeenCalled()
  })

  it('si la función contesta que no se pudo, falla con un mensaje claro', async () => {
    mocks.invoke.mockResolvedValue({ data: { ok: false, message: 'Sesion invalida.' }, error: null })
    await expect(authApi.deleteAccount('ELIMINAR')).rejects.toThrow('Sesion invalida.')
  })
})
