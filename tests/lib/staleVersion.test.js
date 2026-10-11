import { installStaleListener, STALE_EVENT } from '../../src/lib/staleVersion'

describe('versión vieja detectada', () => {
  it('un error de precarga de Vite se vuelve el evento del juego, y se puede desinstalar', () => {
    const target = new EventTarget()
    const seen = vi.fn()
    target.addEventListener(STALE_EVENT, seen)
    const off = installStaleListener(target)
    target.dispatchEvent(new Event('vite:preloadError'))
    expect(seen).toHaveBeenCalledTimes(1)
    off()
    target.dispatchEvent(new Event('vite:preloadError'))
    expect(seen).toHaveBeenCalledTimes(1)
  })

  it('sin ventana no hace nada', () => {
    expect(() => installStaleListener(null)()).not.toThrow()
  })
})
