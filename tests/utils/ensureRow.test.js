import { ensureRow } from '../../src/utils/ensureRow'

// Cliente supabase simulado que registra la secuencia de llamadas
const makeSupabase = ({ upsertError = null, row = { club_id: 'c1', id: 'r1' } } = {}) => {
  const calls = []
  const client = {
    from: (table) => ({
      upsert: (data, opts) => {
        calls.push(['upsert', table, data, opts])
        return Promise.resolve({ error: upsertError })
      },
      select: () => ({
        eq: (col, val) => ({
          maybeSingle: () => {
            calls.push(['select', table, col, val])
            return Promise.resolve({ data: row, error: null })
          }
        })
      })
    })
  }
  return { client, calls }
}

describe('ensureRow', () => {
  it('hace upsert ignorando duplicados y luego lee la fila vigente', async () => {
    const { client, calls } = makeSupabase()
    const res = await ensureRow(client, 'club_fanbase', { club_id: 'c1' }, 'club_id')
    expect(calls[0]).toEqual(['upsert', 'club_fanbase', { club_id: 'c1' }, { onConflict: 'club_id', ignoreDuplicates: true }])
    expect(calls[1]).toEqual(['select', 'club_fanbase', 'club_id', 'c1'])
    expect(res.data.id).toBe('r1')
  })

  it('propaga el error del upsert sin leer', async () => {
    const { client, calls } = makeSupabase({ upsertError: { message: 'boom' } })
    const res = await ensureRow(client, 'club_fanbase', { club_id: 'c1' }, 'club_id')
    expect(res.error.message).toBe('boom')
    expect(calls).toHaveLength(1)
  })
})
