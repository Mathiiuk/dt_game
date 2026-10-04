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
})
