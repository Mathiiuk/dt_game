// Capturas de la pantalla del partido en escritorio y celular, con un partido simulado (módulos reales + datos de prueba).
// Uso: node scripts/e2e/match-shots.mjs [carpeta-de-salida]
import { build } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs'
import { readFileSync, readdirSync, mkdtempSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const out = process.argv[2] || mkdtempSync(join(tmpdir(), 'match-shots-'))
mkdirSync(out, { recursive: true })
const bundle = mkdtempSync(join(tmpdir(), 'match-bundle-'))
const stub = resolve('scripts/e2e/game-context-stub.jsx')
const ctxFile = resolve('src/context/GameContext.jsx')

await build({
  configFile: false,
  logLevel: 'error',
  plugins: [
    { name: 'stub-game-context', enforce: 'pre', resolveId(source, importer) { return importer && source.endsWith('context/GameContext') && resolve(importer, '..', source) + '.jsx' === ctxFile ? stub : null } },
    react(),
    tailwindcss()
  ],
  define: { 'process.env.NODE_ENV': '"production"', __APP_VERSION__: '"test"', __APP_BUILD_TIME__: '"0"' },
  build: { outDir: bundle, emptyOutDir: false, minify: false, cssCodeSplit: false, lib: { entry: 'scripts/e2e/match-harness.jsx', formats: ['iife'], name: 'MatchHarness', fileName: () => 'h.js' } }
})
const css = readdirSync(bundle).filter(f => f.endsWith('.css')).map(f => readFileSync(join(bundle, f), 'utf8')).join('\n')
const js = readFileSync(join(bundle, 'h.js'), 'utf8')

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
async function shoot(name, viewport, { start = true, seconds = 14, actions } = {}) {
  const page = await browser.newPage({ viewport })
  page.on('pageerror', e => console.log('ERROR de página:', e.message))
  // Una dirección http de verdad (no about:blank): la pantalla usa sessionStorage
  const html = `<!doctype html><html lang="es" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body class="bg-bg"><div id="root"></div></body></html>`
  await page.route('http://harness.local/**', route => route.fulfill({ contentType: 'text/html', body: html }))
  await page.goto('http://harness.local/')
  await page.addScriptTag({ content: js })
  await page.waitForTimeout(800)
  if (start) {
    await page.getByRole('button', { name: /comenzar partido/i }).first().click()
    await page.waitForTimeout(seconds * 1000)
  }
  if (actions) await actions(page)
  await page.screenshot({ path: join(out, `${name}.png`) })
  console.log('captura', join(out, `${name}.png`))
  await page.close()
}
await shoot('desktop-1908', { width: 1908, height: 911 })
await shoot('desktop-1280', { width: 1280, height: 720 })
await shoot('mobile-390', { width: 390, height: 844 })
await browser.close()
