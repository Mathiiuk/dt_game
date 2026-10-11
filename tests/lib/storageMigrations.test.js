import { runStorageMigrations, STORAGE_VERSION, STORAGE_VERSION_KEY, MIGRATIONS } from '../../src/lib/storageMigrations'

const memory = (initial = {}) => {
  const data = { ...initial }
  return { data, getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) }, removeItem: (k) => { delete data[k] } }
}

describe('migraciones de los datos guardados en el navegador', () => {
  it('hay una migración por versión, en orden, y la última es la versión actual', () => {
    expect(MIGRATIONS.map(m => m.to)).toEqual(MIGRATIONS.map((_, i) => i + 1))
    expect(STORAGE_VERSION).toBe(MIGRATIONS.length)
  })

  it('en un navegador nuevo queda en la versión actual sin tocar nada más', () => {
    const s = memory({ 'vestuario-consent': 'granted' })
    expect(runStorageMigrations(s)).toEqual({ from: 0, to: STORAGE_VERSION, applied: MIGRATIONS.map(m => m.to) })
    expect(s.getItem(STORAGE_VERSION_KEY)).toBe(String(STORAGE_VERSION))
    expect(s.getItem('vestuario-consent')).toBe('granted')
  })

  it('si ya está al día no hace nada', () => {
    const s = memory({ [STORAGE_VERSION_KEY]: String(STORAGE_VERSION) })
    expect(runStorageMigrations(s).applied).toEqual([])
  })

  it('aplica solo las que faltan, en orden, y deja las claves desconocidas como están', () => {
    const order = []
    const steps = [
      { to: 1, run: () => order.push(1) },
      { to: 2, run: (s) => { order.push(2); s.setItem('nueva', 'ok') } },
      { to: 3, run: () => order.push(3) }
    ]
    const s = memory({ [STORAGE_VERSION_KEY]: '1', 'clave-ajena': 'x' })
    const r = runStorageMigrations(s, { migrations: steps, version: 3 })
    expect(order).toEqual([2, 3])
    expect(r).toEqual({ from: 1, to: 3, applied: [2, 3] })
    expect(s.getItem('clave-ajena')).toBe('x')
    expect(s.getItem('nueva')).toBe('ok')
  })

  it('si un paso falla se omite y no bloquea a los siguientes ni al juego', () => {
    const steps = [{ to: 1, run: () => { throw new Error('roto') } }, { to: 2, run: (s) => s.setItem('dos', '2') }]
    const s = memory()
    const r = runStorageMigrations(s, { migrations: steps, version: 2 })
    expect(r.applied).toEqual([2])
    expect(r.failed).toEqual([1])
    expect(s.getItem('dos')).toBe('2')
  })

  it('sin almacenamiento disponible no explota', () => {
    const broken = { getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('bloqueado') } }
    expect(() => runStorageMigrations(broken)).not.toThrow()
    expect(() => runStorageMigrations(null)).not.toThrow()
  })

  it('un valor de versión raro se trata como 0', () => {
    const s = memory({ [STORAGE_VERSION_KEY]: 'abc' })
    expect(runStorageMigrations(s).from).toBe(0)
  })
})
