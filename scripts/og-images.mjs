// Imágenes de vista previa (1200x630) de cada página pública: se generan con Chromium y se pasan a WebP con Pillow.
// Uso: node scripts/og-images.mjs   (los resultados se versionan en public/og/)
import { createServer } from 'vite'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const out = 'public/og'
mkdirSync(out, { recursive: true })

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const html = (title, tag) => `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#0b1410;color:#f2f7f4;font-family:"Barlow Condensed","Inter",system-ui,sans-serif;position:relative;overflow:hidden}
.pitch{position:absolute;inset:0;opacity:.08}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% -10%,rgba(80,230,150,.28),transparent 70%)}
.wrap{position:relative;padding:64px 80px;height:100%;display:flex;flex-direction:column;justify-content:space-between}
.brand{font-size:44px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#5be39b}
h1{font-size:${title.length > 38 ? 92 : 112}px;line-height:.95;font-weight:800;text-transform:uppercase;max-width:1000px}
.foot{display:flex;justify-content:space-between;font-family:Inter,system-ui,sans-serif;font-size:26px;color:#a9bdb2}
.pill{border:2px solid #5be39b;color:#5be39b;border-radius:999px;padding:6px 22px;font-weight:600}
</style>
<svg class="pitch" viewBox="0 0 1200 630" fill="none" stroke="#fff" stroke-width="3"><rect x="60" y="40" width="1080" height="550"/><line x1="600" y1="40" x2="600" y2="590"/><circle cx="600" cy="315" r="90"/><rect x="60" y="175" width="170" height="280"/><rect x="970" y="175" width="170" height="280"/></svg>
<div class="glow"></div>
<div class="wrap"><div class="brand">Vestuario</div><h1>${esc(title)}</h1><div class="foot"><span>${esc(tag)}</span><span class="pill">www.vestuario.com.ar</span></div></div>`

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', configFile: 'vite.config.ts' })
try {
  const { PUBLIC_PAGES } = await server.ssrLoadModule('/src/data/publicPages.js')
  const { ogSlug } = await server.ssrLoadModule('/src/seo/prerender.js')
  const tmp = join(tmpdir(), 'og-vestuario')
  mkdirSync(tmp, { recursive: true })
  for (const page of PUBLIC_PAGES) {
    const slug = ogSlug(page.path)
    const file = join(tmp, `${slug}.html`)
    const png = join(tmp, `${slug}.png`)
    writeFileSync(file, html(page.h1, page.group === 'guias' ? 'Guía de Vestuario · Juego de Director Técnico' : 'Juego de Director Técnico de fútbol'))
    execFileSync(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,717', `--screenshot=${png}`, `file://${file}`], { stdio: 'ignore' })
    if (!existsSync(png)) throw new Error(`No se generó ${png}`)
    execFileSync('python3', ['-I', '-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").crop((0,0,1200,630)).save(sys.argv[2],"WEBP",quality=78)', png, join(out, `${slug}.webp`)])
    console.log('OG', slug)
  }
  rmSync(tmp, { recursive: true, force: true })
} finally {
  await server.close()
}
