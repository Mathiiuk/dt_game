import { createReadCache } from '../../src/lib/readCache'

// CacheStorage mínimo en memoria
const fakeCaches = () => {
  const stores = new Map()
  return {
    stores,
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map())
      const m = stores.get(name)
      return {
        async put(req, res) { m.delete(req.url); m.set(req.url, await res.text()) },
        async match(req) { return m.has(req.url) ? new Response(m.get(req.url)) : undefined },
        async keys() { return [...m.keys()].map(url => ({ url })) },
        async delete(req) { return m.delete(req.url || req) }
      }
    },
    async delete(name) { return stores.delete(name) }
  }
}

describe('readCache', () => {
  it('guarda y recupera una copia por clave', async () => {
    const cache = createReadCache({ cachesImpl: fakeCaches() })
    await cache.put('k1', { body: 'a', savedAt: 1 })
    expect(await cache.get('k1')).toEqual({ body: 'a', savedAt: 1 })
    expect(await cache.get('otra')).toBeNull()
  })

  it('conserva como máximo N copias (las más viejas se descartan)', async () => {
    const cache = createReadCache({ cachesImpl: fakeCaches(), maxEntries: 3 })
    for (const k of ['a', 'b', 'c', 'd']) await cache.put(k, { body: k, savedAt: 1 })
    expect(await cache.get('a')).toBeNull()
    expect(await cache.get('d')).not.toBeNull()
  })

  it('clear() borra todo, y cambiar de persona también', async () => {
    const storage = new Map()
    const cache = createReadCache({ cachesImpl: fakeCaches(), ownerStore: { get: () => storage.get('o') ?? null, set: (v) => storage.set('o', v) } })
    await cache.bindOwner('u1')
    await cache.put('k', { body: 'x', savedAt: 1 })
    await cache.bindOwner('u1')
    expect(await cache.get('k')).not.toBeNull()
    await cache.bindOwner('u2')
    expect(await cache.get('k')).toBeNull()
    await cache.put('k', { body: 'y', savedAt: 1 })
    await cache.clear()
    expect(await cache.get('k')).toBeNull()
  })

  it('sin Cache Storage (navegador viejo o prueba) no falla: simplemente no guarda', async () => {
    const cache = createReadCache({ cachesImpl: null })
    await expect(cache.put('k', { body: 'x', savedAt: 1 })).resolves.toBeUndefined()
    expect(await cache.get('k')).toBeNull()
    await expect(cache.clear()).resolves.toBeUndefined()
  })
})
