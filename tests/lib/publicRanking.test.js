import { fetchTopManagers, normalizeRows } from '../../src/lib/publicRanking'

const ok = (body) => ({ ok: true, json: async () => body })

describe('tabla pública de mejores DT', () => {
  it('pide la función pública con el límite y la clave pública, sin credenciales de usuario', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok([]))
    await fetchTopManagers(5, { fetchImpl })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toMatch(/\/rest\/v1\/rpc\/public_top_managers_v2$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ p_limit: 5 })
    expect(init.headers.apikey).toBeTruthy()
    expect(init.headers.Authorization).toBeUndefined()
    expect(init.credentials).toBe('omit')
  })

  it('devuelve las filas ordenadas y con los campos que se muestran', async () => {
    const rows = [
      { rank: 1, manager_name: 'Ramón Díaz', points: 10200, titles: 15, matches_won: 480, is_legend: true },
      { rank: 2, manager_name: 'Ana Gómez', points: 1301, titles: 2, matches_won: 15, is_legend: false, id: 'secreto' }
    ]
    const out = await fetchTopManagers(5, { fetchImpl: vi.fn().mockResolvedValue(ok(rows)) })
    expect(out).toEqual([
      { rank: 1, name: 'Ramón Díaz', points: 10200, titles: 15, won: 480, legend: true },
      { rank: 2, name: 'Ana Gómez', points: 1301, titles: 2, won: 15, legend: false }
    ])
  })

  it('si el servidor falla o responde algo raro, avisa con un error (la portada oculta la tabla)', async () => {
    await expect(fetchTopManagers(5, { fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 500 }) })).rejects.toThrow()
    await expect(fetchTopManagers(5, { fetchImpl: vi.fn().mockResolvedValue(ok({ no: 'es lista' })) })).rejects.toThrow()
  })

  it('normaliza: descarta filas sin nombre o con puntos inválidos y recorta nombres largos', () => {
    const out = normalizeRows([
      { rank: 1, manager_name: '  ', points: 10 },
      { rank: 2, manager_name: 'X'.repeat(80), points: 5, titles: 0, matches_won: 1 },
      { rank: 3, manager_name: 'Bien', points: 'nada' }
    ])
    expect(out).toHaveLength(1)
    expect(out[0].name.length).toBeLessThanOrEqual(40)
  })
})
