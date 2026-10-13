import { readFileSync, existsSync } from 'node:fs'
import { INDEXNOW_KEY, INDEXNOW_ENDPOINT, urlsFromSitemap, buildPayload, submitUrls } from '../../src/seo/indexnow'
import { SITE } from '../../src/data/site'

const HOST = new URL(SITE.url).host

describe('IndexNow', () => {
  it('la clave tiene el formato del protocolo y su archivo de verificación existe con el mismo contenido', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/)
    const file = `public/${INDEXNOW_KEY}.txt`
    expect(existsSync(file)).toBe(true)
    expect(readFileSync(file, 'utf8').trim()).toBe(INDEXNOW_KEY)
  })

  it('lee las URLs del sitemap y descarta las de otro host', () => {
    const xml = `<urlset><url><loc>${SITE.url}/</loc></url><url><loc>${SITE.url}/faq</loc></url><url><loc>https://otro.com/x</loc></url></urlset>`
    expect(urlsFromSitemap(xml)).toEqual([`${SITE.url}/`, `${SITE.url}/faq`])
  })

  it('arma el cuerpo con host, clave, ubicación de la clave y la lista de URLs sin repetir', () => {
    const body = buildPayload([`${SITE.url}/a`, `${SITE.url}/a`, `${SITE.url}/b`])
    expect(body).toEqual({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${SITE.url}/${INDEXNOW_KEY}.txt`, urlList: [`${SITE.url}/a`, `${SITE.url}/b`] })
  })

  it('no envía URLs de otro host ni de otro protocolo', () => {
    expect(buildPayload(['http://www.vestuario.com.ar/x', 'https://evil.com/y']).urlList).toEqual([])
  })

  it('envía por POST y devuelve el código real; solo 200 y 202 cuentan como enviado', async () => {
    const fetchImpl = vi.fn(async () => ({ status: 202 }))
    const r = await submitUrls([`${SITE.url}/a`], { fetchImpl, sleep: async () => {} })
    expect(fetchImpl).toHaveBeenCalledWith(INDEXNOW_ENDPOINT, expect.objectContaining({ method: 'POST' }))
    expect(r).toEqual({ ok: true, status: 202, sent: 1 })
  })

  it('reintenta con espera progresiva ante errores del servidor y se rinde al tercer intento', async () => {
    const fetchImpl = vi.fn(async () => ({ status: 500 }))
    const waits = []
    const r = await submitUrls([`${SITE.url}/a`], { fetchImpl, sleep: async (ms) => waits.push(ms) })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(waits).toEqual([2000, 4000])
    expect(r.ok).toBe(false)
    expect(r.status).toBe(500)
  })

  it('no reintenta ante un error del cliente (clave o URL inválida) y lo informa', async () => {
    const fetchImpl = vi.fn(async () => ({ status: 403 }))
    const r = await submitUrls([`${SITE.url}/a`], { fetchImpl, sleep: async () => {} })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(r).toMatchObject({ ok: false, status: 403 })
  })

  it('con una lista vacía no hace ninguna llamada', async () => {
    const fetchImpl = vi.fn()
    const r = await submitUrls([], { fetchImpl })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(r.sent).toBe(0)
  })

  it('el script de envío y su comando existen, y la clave no se imprime en los registros', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
    expect(pkg.scripts.indexnow).toBe('node scripts/indexnow.mjs')
    expect(readFileSync('scripts/indexnow.mjs', 'utf8')).not.toMatch(/console\.\w+\([^)]*INDEXNOW_KEY/)
  })
})
