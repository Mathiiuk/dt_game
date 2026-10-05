const state = { result: { error: null }, calls: [] }

vi.mock('../../src/api/supabase', () => ({
  supabase: { functions: { invoke: async (...a) => { state.calls.push(a); if (state.result.throws) throw new Error('sin red'); return state.result } } }
}))

import { emailApi } from '../../src/api/email'

describe('correos del juego', () => {
  beforeEach(() => { state.calls = []; state.result = { error: null }; vi.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => vi.restoreAllMocks())

  it('pide la plantilla de bienvenida a la función de correo', async () => {
    await emailApi.sendWelcome()
    expect(state.calls).toEqual([['send-email', { body: { template: 'welcome' } }]])
  })

  it('si el servicio responde con error, no frena lo que se estaba haciendo', async () => {
    state.result = { error: { message: 'El servicio de correo no está disponible.' } }
    await expect(emailApi.sendWelcome()).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })

  it('si no hay red, tampoco', async () => {
    state.result = { throws: true }
    await expect(emailApi.sendWelcome()).resolves.toBeUndefined()
  })
})
