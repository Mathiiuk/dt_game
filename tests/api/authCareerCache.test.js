// Leer la sesión no vuelve a consultar la carrera en cada pantalla (se hacía en cada visita y en cada vuelta a la pestaña)
const { st } = vi.hoisted(() => ({ st: { careerReads: 0 } }))

vi.mock('../../src/lib/recaptcha', () => ({ isRecaptchaEnabled: () => false, getRecaptchaToken: vi.fn() }))
vi.mock('../../src/api/audit', () => ({ auditApi: { logAction: vi.fn(async () => {}) } }))
vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'order', 'limit', 'insert', 'update']) q[m] = () => q
    q.maybeSingle = async () => { if (table === 'careers') st.careerReads++; return { data: { id: 'career1' } } }
    q.single = async () => ({ data: { id: 'career1' } })
    q.then = (r) => r({ data: null, error: null })
    return q
  }
  return {
    supabase: {
      from: chain,
      auth: {
        getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u1', email: 'a@b.co', user_metadata: {} }, expires_at: 1 } }, error: null })),
        signOut: vi.fn(async () => ({ error: null }))
      }
    }
  }
})

import { authApi } from '../../src/api/auth'

describe('sesión y carrera activa', () => {
  beforeEach(() => { st.careerReads = 0 })

  it('la carrera activa se consulta una sola vez por un rato', async () => {
    const a = await authApi.getSession()
    const b = await authApi.getSession()
    const c = await authApi.getSession()
    expect([a.careerId, b.careerId, c.careerId]).toEqual(['career1', 'career1', 'career1'])
    expect(st.careerReads).toBe(1)
  })

  it('al cerrar la sesión se olvida: el próximo ingreso vuelve a consultar', async () => {
    await authApi.getSession()
    await authApi.logout()
    st.careerReads = 0
    await authApi.getSession()
    expect(st.careerReads).toBe(1)
  })
})
