// Prueba en navegador real: una pestaña con la versión vieja pide una pantalla que ya no existe → se repara sola
// (desregistra el service worker, vacía las cachés, recarga) y después la pantalla carga.
// Uso: npm run build && node scripts/e2e/repair-stale.mjs   (levanta `vite preview` en el puerto 4179)
import http from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs'

// Servidor mínimo de dist/ que puede "perder" el archivo de una pantalla (como pasa tras un deploy: el nombre viejo ya no existe).
// El service worker hace sus propios pedidos, que `page.route` no ve: por eso el corte se hace en el servidor.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.webp': 'image/webp', '.json': 'application/json' }
let broken = true
const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  if (broken && /\/assets\/DemoScreen-[^/]+\.js$/.test(path)) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('no existe') }
  let file = join('dist', path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = join('dist', 'index.html') // rutas del juego: la app
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' })
  res.end(readFileSync(file))
})
await new Promise(r => server.listen(4179, r))
const url = 'http://localhost:4179/'
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await browser.newContext({ serviceWorkers: 'allow' })
const page = await ctx.newPage()
const results = []
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK ' : 'FALLÓ'} ${name}${extra ? ` (${extra})` : ''}`) }

await page.route('**/*googletagmanager*', r => r.abort())

// El service worker se registra al abrir el juego (el inicio de sesión ya lo carga)
await page.goto(url + 'login', { waitUntil: 'load' })
await page.waitForTimeout(2000)
await page.evaluate(async () => { await navigator.serviceWorker.ready })
await page.reload({ waitUntil: 'load' })
await page.waitForTimeout(2500) // ahora la página está controlada por el service worker
const before = await page.evaluate(async () => ({ regs: (await navigator.serviceWorker.getRegistrations()).length, caches: (await caches.keys()).length, controlled: Boolean(navigator.serviceWorker.controller) }))
check('el service worker está instalado y controla la página', before.regs >= 1 && before.controlled, JSON.stringify(before))
check('hay cachés guardadas', before.caches >= 1, `${before.caches}`)

await page.evaluate(() => { window.__marker = 'sin recargar' })
const reloaded = page.waitForNavigation({ waitUntil: 'load', timeout: 20000 }).then(() => true).catch(() => false)
await page.evaluate(() => { history.pushState({}, '', '/demo'); window.dispatchEvent(new PopStateEvent('popstate')) }) // el router pide la pantalla /demo (archivo inexistente)
const didReload = await reloaded
check('ante el archivo inexistente la app se recarga sola', didReload)
await page.waitForLoadState('load')
await page.waitForTimeout(1500)
const marker = await page.evaluate(() => window.__marker)
check('la página es nueva (no quedó el estado de antes)', marker === undefined)
const flag = await page.evaluate(() => sessionStorage.getItem('vestuario-repair-done'))
check('quedó marcada la reparación (tope de una vez por sesión)', flag === '1')

// El servidor "ya tiene" los archivos nuevos: la pantalla carga
broken = false
await page.goto(url + 'demo', { waitUntil: 'load' })
await page.waitForTimeout(2000)
const h1 = await page.locator('h1').first().innerText().catch(() => '')
check('después de reparar, la pantalla /demo carga', h1.length > 3, h1)

await browser.close()
await new Promise(r => server.close(r))
const failed = results.filter(r => !r).length
console.log(`\n${results.length - failed}/${results.length} comprobaciones OK`)
process.exit(failed ? 1 : 0)
