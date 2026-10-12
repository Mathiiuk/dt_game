// Prueba en un navegador real (Chromium) de la cancha en vivo con un partido simulado de 90 minutos.
// Comprueba el recorrido de la pelota, el cartel de gol, los bancos y las tarjetas, y mide el costo (cuadros por segundo y tareas largas)
// con la CPU frenada 6 veces para parecerse a un celular de gama baja.
// Uso: npm run build && node scripts/e2e/live-pitch.mjs   (usa el CSS de dist/ y Chromium de PLAYWRIGHT)
import { build } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs'
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const out = mkdtempSync(join(tmpdir(), 'live-pitch-'))
await build({
  configFile: false,
  logLevel: 'error',
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: { outDir: out, emptyOutDir: false, minify: false, lib: { entry: 'scripts/e2e/live-pitch-harness.jsx', formats: ['iife'], name: 'LivePitchHarness', fileName: () => 'h.js' } }
})
const cssFile = readdirSync('dist/assets').find(f => f.endsWith('.css'))
if (!cssFile) throw new Error('Falta dist/: corré npm run build primero')
const css = readFileSync(join('dist/assets', cssFile), 'utf8')

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 410, height: 300 } })
await page.setContent(`<!doctype html><html data-theme="light"><head><style>${css}</style></head><body class="bg-bg"><div id="root"></div></body></html>`)
await page.addScriptTag({ content: readFileSync(join(out, 'h.js'), 'utf8') })
const cdp = await page.context().newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })

const results = []
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'OK ' : 'FALLÓ'} ${name}${extra ? ` (${extra})` : ''}`) }
const at = async (m, s) => { await page.evaluate(([a, b]) => window.__setMatch(a, b), [m, s]); await page.waitForTimeout(80) }
const ballX = () => page.getAttribute('[data-testid=live-ball]', 'data-x').then(Number)
const q = (sel) => page.locator(sel).count()

await at(0)
check('antes de la primera jugada la pelota anda por el medio', (await ballX()) > 20 && (await ballX()) < 80)
await at(6)
check('remate local: la pelota va al arco derecho', (await ballX()) > 80, `x=${await ballX()}`)
await at(12)
check('gol local: aparece el cartel', (await q('[data-testid=goal-flash]')) === 1)
check('gol local: festeja el banco local y se lamenta el visitante',
  (await page.getAttribute('[data-testid=bench-home]', 'data-cheer')) === 'true' && (await page.getAttribute('[data-testid=bench-away]', 'data-lament')) === 'true')
await at(16)
check('cuatro minutos después el cartel se apaga', (await q('[data-testid=goal-flash]')) === 0)
await at(33)
check('gol visitante: festeja el banco visitante y se lamenta el local',
  (await page.getAttribute('[data-testid=bench-away]', 'data-cheer')) === 'true' && (await page.getAttribute('[data-testid=bench-home]', 'data-lament')) === 'true')
await at(52)
check('amarilla visible', (await page.getAttribute('[data-testid=card-flash]', 'data-kind')) === 'yellow')
await at(61)
check('penal visitante: la pelota va al punto penal izquierdo', Math.abs((await ballX()) - 11) < 0.5, `x=${await ballX()}`)
await at(75)
check('roja visible', (await page.getAttribute('[data-testid=card-flash]', 'data-kind')) === 'red')
await at(90, 'finished')
check('al final la pelota queda en el medio', (await ballX()) === 50)
check('la cancha es decorativa (aria-hidden)', (await page.getAttribute('[data-testid=live-ball] >> xpath=ancestor::div[@aria-hidden="true"][1]', 'aria-hidden').catch(() => null)) === 'true')

// Costo: 90 minutos simulados en ~13 s (150 ms por minuto) con la CPU frenada
await page.evaluate(() => {
  window.__frames = []
  window.__long = 0
  let last = performance.now()
  const tick = (t) => { window.__frames.push(t - last); last = t; requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  new PerformanceObserver(list => { window.__long += list.getEntries().length }).observe({ entryTypes: ['longtask'] })
})
for (let m = 0; m <= 90; m++) { await page.evaluate(([a]) => window.__setMatch(a, 'playing'), [m]); await page.waitForTimeout(150) }
const perf = await page.evaluate(() => {
  const f = window.__frames.slice(2).sort((a, b) => a - b)
  const avg = f.reduce((s, x) => s + x, 0) / f.length
  return { frames: f.length, fps: Math.round(1000 / avg), p95ms: Math.round(f[Math.floor(f.length * 0.95)]), maxMs: Math.round(f[f.length - 1]), longTasks: window.__long }
})
console.log('Rendimiento con la CPU 6x más lenta:', JSON.stringify(perf))
check('al menos 30 cuadros por segundo con la CPU frenada', perf.fps >= 30, `${perf.fps} fps`)
check('sin tareas largas (más de 50 ms) por la cancha', perf.longTasks === 0, `${perf.longTasks}`)

await page.screenshot({ path: join(out, 'final.png') })
await browser.close()
const failed = results.filter(r => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`)
process.exit(failed.length ? 1 : 0)
