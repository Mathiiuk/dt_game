import { getNetStatus, setSlow, subscribeNet, resetNetStatus } from '../../src/lib/netStatus'

describe('netStatus', () => {
  beforeEach(() => resetNetStatus())

  it('arranca en línea y sin lentitud', () => {
    expect(getNetStatus()).toEqual({ online: true, slow: false, lastOnlineAt: null })
  })

  it('los eventos del navegador cambian el estado y avisan a los suscriptos', () => {
    const seen = []
    const off = subscribeNet(() => seen.push(getNetStatus().online))
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('online'))
    off()
    window.dispatchEvent(new Event('offline'))
    expect(seen).toEqual([false, true])
    window.dispatchEvent(new Event('online'))
  })

  it('"lento" se marca y se apaga, y sin conexión no se considera lento', () => {
    setSlow(true)
    expect(getNetStatus().slow).toBe(true)
    window.dispatchEvent(new Event('offline'))
    expect(getNetStatus().slow).toBe(false)
    window.dispatchEvent(new Event('online'))
  })

  it('el estado es el mismo objeto mientras nada cambia (requisito de useSyncExternalStore)', () => {
    expect(getNetStatus()).toBe(getNetStatus())
    setSlow(true)
    const a = getNetStatus()
    setSlow(true)
    expect(getNetStatus()).toBe(a)
  })
})
