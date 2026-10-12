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
body{width:1200px;height:630px;background:#F5EFE0;color:#14213D;font-family:"Barlow Condensed","Inter",system-ui,sans-serif;position:relative;overflow:hidden}
.pitch{position:absolute;inset:0;opacity:.07}
.wrap{position:relative;padding:44px 72px 40px;height:100%;display:flex;flex-direction:column}
.top{display:flex;justify-content:space-between;font-size:24px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#4A5470}
.mast{text-align:center;margin-top:12px;border-top:7px double #14213D;border-bottom:2px solid #14213D;padding:14px 0 10px}
.mast b{display:block;font-family:"Roboto Slab",Georgia,serif;font-weight:800;font-size:76px;letter-spacing:.16em;text-transform:uppercase;line-height:1}
.mast span{display:block;margin-top:6px;font-size:22px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#4A5470}
.kick{margin-top:26px;font-size:26px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#BE2A35}
h1{margin-top:8px;font-family:"Roboto Slab",Georgia,serif;font-size:${title.length > 38 ? 66 : 84}px;line-height:1;font-weight:800;letter-spacing:-.02em;max-width:1040px}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #B9AB86;padding-top:14px;font-family:Inter,system-ui,sans-serif;font-size:24px;color:#4A5470}
.pill{background:#1F4E9D;color:#FFFBF0;border-radius:6px;padding:8px 22px;font-weight:600}
</style>
<svg class="pitch" viewBox="0 0 1200 630" fill="none" stroke="#14213D" stroke-width="3"><rect x="60" y="40" width="1080" height="550"/><line x1="600" y1="40" x2="600" y2="590"/><circle cx="600" cy="315" r="90"/></svg>
<div class="wrap"><div class="top"><span>Juego gratis · sin descargas</span><span>Edición de hoy</span></div><div class="mast"><b>Vestuario</b><span>El diario del DT</span></div><div class="kick">${esc(tag)}</div><h1>${esc(title)}</h1><div class="foot"><span>Vos sos el DT</span><span class="pill">www.vestuario.com.ar</span></div></div>`

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
    writeFileSync(file, html(page.h1, page.group === 'guias' ? 'Guía · Juego de Director Técnico' : 'Portada · Fútbol'))
    execFileSync(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,717', `--screenshot=${png}`, `file://${file}`], { stdio: 'ignore' })
    if (!existsSync(png)) throw new Error(`No se generó ${png}`)
    execFileSync('python3', ['-I', '-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").crop((0,0,1200,630)).save(sys.argv[2],"WEBP",quality=78)', png, join(out, `${slug}.webp`)])
    console.log('OG', slug)
  }
  // Portada: la imagen del sitio (og:image de la home) vive en public/ y no en public/og/
  const homeHtml = join(tmp, 'home.html')
  const homePng = join(tmp, 'home.png')
  writeFileSync(homeHtml, html('Vos sos el DT.', 'Portada · Fútbol'))
  execFileSync(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--window-size=1200,717', `--screenshot=${homePng}`, `file://${homeHtml}`], { stdio: 'ignore' })
  execFileSync('python3', ['-I', '-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").crop((0,0,1200,630)).save(sys.argv[2],"WEBP",quality=78)', homePng, 'public/vestuario-og-home.webp'])
  console.log('OG home')
  rmSync(tmp, { recursive: true, force: true })
} finally {
  await server.close()
}
