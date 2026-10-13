import { repairAndReload, REPAIR_FLAG } from '../../src/lib/repairApp'

const make = ({ regs = 2, keys = ['workbox-precache-v2', 'vestuario-assets-v1'], sw = true, cache = true, store = {} } = {}) => {
  const unregister = vi.fn().mockResolvedValue(true)
  const del = vi.fn().mockResolvedValue(true)
  const reload = vi.fn()
  const storage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) } }
  return {
    unregister, del, reload, store,
    deps: {
      nav: sw ? { serviceWorker: { getRegistrations: async () => Array.from({ length: regs }, () => ({ unregister })) } } : {},
      cacheStorage: cache ? { keys: async () => keys, delete: del } : undefined,
      reload,
      storage
    }
  }
}

describe('reparar una versión vieja atrapada por el service worker', () => {
  it('desregistra todos los service workers, borra todas las cachés y recién ahí recarga', async () => {
    const t = make()
    const order = []
    t.unregister.mockImplementation(async () => { order.push('sw'); return true })
    t.del.mockImplementation(async () => { order.push('cache'); return true })
    t.reload.mockImplementation(() => order.push('reload'))
    expect(await repairAndReload(t.deps)).toBe(true)
    expect(t.unregister).toHaveBeenCalledTimes(2)
    expect(t.del).toHaveBeenCalledWith('workbox-precache-v2')
    expect(t.del).toHaveBeenCalledWith('vestuario-assets-v1')
    expect(order.at(-1)).toBe('reload')
    expect(order.filter(x => x === 'reload')).toHaveLength(1)
  })

  it('tiene un tope: solo repara solo una vez por sesión (si sigue fallando, no entra en un bucle de recargas)', async () => {
    const t = make()
    expect(await repairAndReload(t.deps)).toBe(true)
    expect(t.store[REPAIR_FLAG]).toBe('1')
    expect(await repairAndReload(t.deps)).toBe(false)
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('con force=true repara aunque ya se haya intentado (cuando la persona toca el botón)', async () => {
    const t = make({ store: { [REPAIR_FLAG]: '1' } })
    expect(await repairAndReload({ ...t.deps, force: true })).toBe(true)
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('si el navegador no tiene service workers ni cachés (Safari privado), igual recarga y no falla', async () => {
    const t = make({ sw: false, cache: false })
    await expect(repairAndReload(t.deps)).resolves.toBe(true)
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('si desregistrar o borrar falla, recarga igual (nunca deja la pantalla trabada)', async () => {
    const t = make()
    t.unregister.mockRejectedValue(new Error('no'))
    t.del.mockRejectedValue(new Error('no'))
    await expect(repairAndReload(t.deps)).resolves.toBe(true)
    expect(t.reload).toHaveBeenCalledTimes(1)
  })

  it('sin almacenamiento de sesión (bloqueado) también repara', async () => {
    const t = make()
    t.deps.storage = { getItem() { throw new Error('bloqueado') }, setItem() { throw new Error('bloqueado') } }
    await expect(repairAndReload(t.deps)).resolves.toBe(true)
    expect(t.reload).toHaveBeenCalledTimes(1)
  })
})
