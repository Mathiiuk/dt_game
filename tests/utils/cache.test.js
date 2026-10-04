import { queryCache } from '../../src/utils/cache'

describe('queryCache', () => {
  beforeEach(() => queryCache.clear())

  it('reutiliza la petición en vuelo (deduplicación concurrente)', async () => {
    const fetcher = vi.fn(async () => { await new Promise(r => setTimeout(r, 10)); return 42 })
    const [a, b] = await Promise.all([queryCache.fetch('k', fetcher), queryCache.fetch('k', fetcher)])
    expect([a, b]).toEqual([42, 42])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('sirve desde caché mientras no expire y vuelve a consultar después', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(async () => 'x')
    await queryCache.fetch('k', fetcher, 1000)
    await queryCache.fetch('k', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1500)
    await queryCache.fetch('k', fetcher, 1000)
    expect(fetcher).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('invalida por prefijo', async () => {
    const fetcher = vi.fn(async () => 1)
    await queryCache.fetch('club:1', fetcher)
    await queryCache.fetch('club:2', fetcher)
    queryCache.invalidate('club:')
    await queryCache.fetch('club:1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('no cachea resultados vacíos (null/undefined) y vuelve a consultar', async () => {
    const fetcher = vi.fn(async () => null)
    expect(await queryCache.fetch('vacio', fetcher)).toBeNull()
    expect(await queryCache.fetch('vacio', fetcher)).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('set/get respetan el TTL y comparten caché con fetch', async () => {
    vi.useFakeTimers()
    queryCache.set('manual', { a: 1 }, 1000)
    expect(queryCache.get('manual')).toEqual({ a: 1 })
    const fetcher = vi.fn(async () => 'nuevo')
    expect(await queryCache.fetch('manual', fetcher)).toEqual({ a: 1 })
    expect(fetcher).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1500)
    expect(queryCache.get('manual')).toBeNull()
    vi.useRealTimers()
  })

  it('propaga el error del fetcher sin dejar basura en la caché', async () => {
    await expect(queryCache.fetch('err', async () => { throw new Error('boom') })).rejects.toThrow('boom')
    expect(queryCache.get('err')).toBeNull()
  })
})
