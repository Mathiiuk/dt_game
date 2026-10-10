// Verificar el balance: compara clubs.budget con el último saldo del libro, sin cambiar nada
const { st } = vi.hoisted(() => ({ st: { budget: 1000, ledger: [{ balance_after: 1000 }], writes: 0 } }))

vi.mock('../../src/api/supabase', () => {
  const chain = (table) => {
    const q = {}
    for (const m of ['select', 'eq', 'order', 'limit']) q[m] = () => q
    for (const m of ['insert', 'update', 'upsert', 'delete']) q[m] = () => { st.writes++; return q }
    q.single = async () => ({ data: { budget: st.budget }, error: null })
    q.then = (r) => r({ data: table === 'financial_transactions_ledger' ? st.ledger : [], error: null })
    return q
  }
  return { supabase: { from: chain, rpc: async () => ({ data: null, error: null }) } }
})

import { financesApi } from '../../src/api/finances'

describe('financesApi.verifyBalance', () => {
  beforeEach(() => { st.writes = 0 })

  it('cuadra si la caja es el último saldo', async () => {
    st.budget = 1000; st.ledger = [{ balance_after: 1000 }]
    expect(await financesApi.verifyBalance('c1')).toMatchObject({ status: 'OK', budget: 1000, ledgerBalance: 1000, drift: 0 })
  })

  it('informa la diferencia y no escribe nada', async () => {
    st.budget = 1500; st.ledger = [{ balance_after: 1000 }]
    const res = await financesApi.verifyBalance('c1')
    expect(res).toMatchObject({ status: 'DRIFT', drift: 500 })
    expect(st.writes).toBe(0)
  })

  it('sin movimientos en el libro no hay con qué comparar', async () => {
    st.ledger = []
    expect((await financesApi.verifyBalance('c1')).status).toBe('EMPTY')
  })

  it('sin club devuelve null', async () => {
    expect(await financesApi.verifyBalance(null)).toBeNull()
  })
})
