import { createNetFetch } from '../../src/lib/netFetch'

const ok = (body = '{}', status = 200, headers = {}) => new Response(body, { status, headers })
const sleepNow = () => Promise.resolve()

describe('netFetch', () => {
  it('una lectura que falla por red se reintenta y termina bien', async () => {
    const fetchImpl = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ok('1'))
    const f = createNetFetch({ fetchImpl, sleep: sleepNow })
    const res = await f('https://x/rest/v1/clubs', { method: 'GET' })
    expect(await res.text()).toBe('1')
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('reintenta ante 503 pero no ante 400 ni 404', async () => {
    const f503 = vi.fn().mockResolvedValueOnce(ok('', 503)).mockResolvedValueOnce(ok('', 200))
    expect((await createNetFetch({ fetchImpl: f503, sleep: sleepNow })('https://x/a')).status).toBe(200)
    expect(f503).toHaveBeenCalledTimes(2)
    const f400 = vi.fn().mockResolvedValue(ok('', 400))
    expect((await createNetFetch({ fetchImpl: f400, sleep: sleepNow })('https://x/a')).status).toBe(400)
    expect(f400).toHaveBeenCalledTimes(1)
  })

  it('después de los reintentos devuelve el error o la última respuesta', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(createNetFetch({ fetchImpl: f, retries: 2, sleep: sleepNow })('https://x/a')).rejects.toThrow('Failed to fetch')
    expect(f).toHaveBeenCalledTimes(3)
    const f503 = vi.fn().mockResolvedValue(ok('', 503))
    expect((await createNetFetch({ fetchImpl: f503, retries: 1, sleep: sleepNow })('https://x/a')).status).toBe(503)
    expect(f503).toHaveBeenCalledTimes(2)
  })

  it('las escrituras (POST/PATCH/DELETE) nunca se reintentan solas', async () => {
    for (const method of ['POST', 'PATCH', 'DELETE', 'PUT']) {
      const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
      await expect(createNetFetch({ fetchImpl: f, sleep: sleepNow })('https://x/rest/v1/rpc/fichar', { method })).rejects.toThrow()
      expect(f).toHaveBeenCalledTimes(1)
    }
    const f503 = vi.fn().mockResolvedValue(ok('', 503))
    expect((await createNetFetch({ fetchImpl: f503, sleep: sleepNow })('https://x/a', { method: 'POST' })).status).toBe(503)
    expect(f503).toHaveBeenCalledTimes(1)
  })

  it('la espera entre intentos crece y respeta Retry-After (con tope)', async () => {
    const waits = []
    const f = vi.fn().mockResolvedValueOnce(ok('', 503)).mockResolvedValueOnce(ok('', 503)).mockResolvedValueOnce(ok('', 200))
    await createNetFetch({ fetchImpl: f, baseDelayMs: 500, retries: 2, sleep: async (ms) => { waits.push(ms) } })('https://x/a')
    expect(waits).toEqual([500, 1000])
    const w2 = []
    const g = vi.fn().mockResolvedValueOnce(ok('', 503, { 'Retry-After': '2' })).mockResolvedValueOnce(ok('', 503, { 'Retry-After': '120' })).mockResolvedValueOnce(ok('', 200))
    await createNetFetch({ fetchImpl: g, retries: 2, sleep: async (ms) => { w2.push(ms) } })('https://x/a')
    expect(w2).toEqual([2000, 5000])
  })

  describe('tiempo máximo', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('una lectura que no responde se corta a los 15 s y se reintenta', async () => {
      const f = vi.fn((url, init) => new Promise((resolve, reject) => {
        if (f.mock.calls.length === 1) init.signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')))
        else resolve(ok('listo'))
      }))
      const p = createNetFetch({ fetchImpl: f, timeoutMs: 15000, sleep: sleepNow })('https://x/a')
      await vi.advanceTimersByTimeAsync(15001)
      expect(await (await p).text()).toBe('listo')
      expect(f).toHaveBeenCalledTimes(2)
    })

    it('una escritura lenta NO se corta (podría haberse guardado ya)', async () => {
      let resolveIt
      const f = vi.fn(() => new Promise(resolve => { resolveIt = () => resolve(ok('guardado')) }))
      const p = createNetFetch({ fetchImpl: f, timeoutMs: 15000, sleep: sleepNow })('https://x/rest/v1/rpc/avanzar', { method: 'POST' })
      await vi.advanceTimersByTimeAsync(60000)
      resolveIt()
      expect(await (await p).text()).toBe('guardado')
    })

    it('avisa cuando algún pedido tarda más de 4 s y cuando ya no hay nada lento', async () => {
      const changes = []
      let resolveIt
      const f = vi.fn(() => new Promise(resolve => { resolveIt = () => resolve(ok('x')) }))
      const p = createNetFetch({ fetchImpl: f, slowAfterMs: 4000, onSlowChange: (v) => changes.push(v) })('https://x/a')
      await vi.advanceTimersByTimeAsync(3900)
      expect(changes).toEqual([])
      await vi.advanceTimersByTimeAsync(200)
      expect(changes).toEqual([true])
      resolveIt()
      await p
      expect(changes).toEqual([true, false])
    })
  })

  it('si la persona cancela (signal propio) no se reintenta', async () => {
    const ctrl = new AbortController()
    const f = vi.fn().mockRejectedValue(new DOMException('abort', 'AbortError'))
    ctrl.abort()
    await expect(createNetFetch({ fetchImpl: f, sleep: sleepNow })('https://x/a', { signal: ctrl.signal })).rejects.toThrow()
    expect(f).toHaveBeenCalledTimes(1)
  })
})

describe('netFetch con copia de lecturas', () => {
  const makeStore = () => {
    const map = new Map()
    return { map, get: async (k) => map.get(k) || null, put: async (k, v) => { map.set(k, v) } }
  }
  const rest = 'https://x.supabase.co/rest/v1/clubs?id=eq.1'

  it('guarda las lecturas buenas de la base y, si después falla la red, devuelve la última copia', async () => {
    const store = makeStore()
    const f = vi.fn().mockResolvedValueOnce(ok('{"name":"Potrero"}')).mockRejectedValue(new TypeError('Failed to fetch'))
    const net = createNetFetch({ fetchImpl: f, store, retries: 0, sleep: sleepNow })
    expect(await (await net(rest)).text()).toBe('{"name":"Potrero"}')
    await vi.waitFor(() => expect(store.map.size).toBe(1))
    const res = await net(rest)
    expect(await res.text()).toBe('{"name":"Potrero"}')
    expect(res.headers.get('x-vestuario-stale')).toBe('1')
  })

  it('con red buena nunca devuelve la copia: manda lo del servidor, aunque sea un error de la app (4xx)', async () => {
    const store = makeStore()
    store.map.set('stale', { body: 'viejo', status: 200, headers: {}, savedAt: Date.now() })
    const f = vi.fn().mockResolvedValue(ok('{"error":"rls"}', 403))
    const res = await createNetFetch({ fetchImpl: f, store })(rest)
    expect(res.status).toBe(403)
  })

  it('la copia distingue por cabecera Accept (objeto único vs lista) y no se usa si pasó más de un día', async () => {
    const store = makeStore()
    const f = vi.fn().mockResolvedValueOnce(ok('[1]')).mockResolvedValueOnce(ok('{"a":1}')).mockRejectedValue(new TypeError('x'))
    const net = createNetFetch({ fetchImpl: f, store, retries: 0, sleep: sleepNow })
    await net(rest, { headers: { Accept: 'application/json' } })
    await net(rest, { headers: { Accept: 'application/vnd.pgrst.object+json' } })
    await vi.waitFor(() => expect(store.map.size).toBe(2))
    expect(await (await net(rest, { headers: { Accept: 'application/vnd.pgrst.object+json' } })).text()).toBe('{"a":1}')
    for (const entry of store.map.values()) entry.savedAt = Date.now() - 25 * 3600 * 1000
    await expect(net(rest, { headers: { Accept: 'application/json' } })).rejects.toThrow()
  })

  it('sin conexión (el navegador lo sabe) no espera ni reintenta: usa la copia al instante', async () => {
    const store = makeStore()
    store.map.set(`${rest}|`, { body: '{"name":"Potrero"}', status: 200, headers: {}, savedAt: Date.now() })
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const waits = []
    const res = await createNetFetch({ fetchImpl: f, store, isOnline: () => false, sleep: async (ms) => { waits.push(ms) } })(rest)
    expect(await res.text()).toBe('{"name":"Potrero"}')
    expect(f).toHaveBeenCalledTimes(1)
    expect(waits).toEqual([])
  })

  it('solo guarda datos de /rest/v1 (no la sesión ni otras llamadas) y nada que no sea una lectura', async () => {
    const store = makeStore()
    const f = vi.fn().mockResolvedValue(ok('{}'))
    const net = createNetFetch({ fetchImpl: f, store })
    await net('https://x.supabase.co/auth/v1/user')
    await net('https://x.supabase.co/rest/v1/rpc/avanzar', { method: 'POST' })
    await net('https://example.com/otra-cosa')
    await new Promise(r => setTimeout(r, 0))
    expect(store.map.size).toBe(0)
  })
})
