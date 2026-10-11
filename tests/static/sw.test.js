import { readFileSync } from 'node:fs'

describe('service worker propio', () => {
  const sw = readFileSync('src/sw.js', 'utf8')
  const config = readFileSync('vite.config.ts', 'utf8')

  it('el build usa el service worker de src/sw.js con el precache de Workbox', () => {
    expect(config).toMatch(/strategies: 'injectManifest'/)
    expect(config).toMatch(/filename: 'sw\.js'/)
    expect(sw).toContain('precacheAndRoute(self.__WB_MANIFEST)')
    expect(sw).toContain('cleanupOutdatedCaches()')
  })

  it('las actualizaciones solo se instalan cuando la app lo pide (mensaje SKIP_WAITING), no solas', () => {
    expect(sw).toMatch(/event\.data\.type === 'SKIP_WAITING'/)
    expect(sw).not.toMatch(/^self\.skipWaiting\(\)/m)
  })

  it('los archivos para buscadores se piden siempre a la red', () => {
    expect(sw).toContain('/^\\/robots\\.txt$/')
    expect(sw).toContain('/^\\/sitemap\\.xml$/')
  })

  it('muestra los avisos y al tocarlos abre solo rutas del propio sitio', () => {
    expect(sw).toContain("addEventListener('push'")
    expect(sw).toContain("addEventListener('notificationclick'")
    expect(sw).toContain('targetUrl(')
  })
})
