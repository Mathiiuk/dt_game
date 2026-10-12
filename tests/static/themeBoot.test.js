// El tema se fija en index.html ANTES de pintar (sin parpadeo) con el mismo cálculo que src/lib/theme.js
import { readFileSync } from 'node:fs'
import { THEME_KEY, THEME_COLORS, resolveTheme, getStoredTheme } from '../../src/lib/theme'

const html = readFileSync('index.html', 'utf8')
const head = html.slice(0, html.indexOf('</head>'))
const block = head.slice(head.indexOf('<!-- Tema'), head.indexOf('<!-- /Tema -->'))
const code = (block.match(/<script>([\s\S]*?)<\/script>/) || [])[1]

const run = ({ stored = null, dark = false, throws = false } = {}) => {
  const meta = { content: '#F5EFE0' }
  const root = { dataset: {}, style: {} }
  const document = { documentElement: root, querySelector: () => meta }
  const localStorage = { getItem: (k) => { if (throws) throw new Error('bloqueado'); return k === THEME_KEY ? stored : null } }
  const matchMedia = () => ({ matches: dark })
  new Function('document', 'localStorage', 'matchMedia', code)(document, localStorage, matchMedia)
  return { theme: root.dataset.theme, scheme: root.style.colorScheme, color: meta.content }
}

describe('tema antes de pintar (index.html)', () => {
  it('hay un bloque de tema con script y color de la barra del navegador', () => {
    expect(code).toBeTruthy()
    expect(block).toMatch(/<meta name="theme-color" content="#F5EFE0"/)
    expect(html.indexOf('<!-- Tema')).toBeLessThan(html.indexOf('<!-- SEO de la portada'))
  })

  it('da el mismo resultado que theme.js en todas las combinaciones', () => {
    for (const stored of [null, 'auto', 'light', 'dark', 'rosa']) {
      for (const dark of [false, true]) {
        const pref = getStoredTheme({ getItem: () => stored })
        const expected = resolveTheme(pref, dark)
        expect(run({ stored, dark })).toEqual({ theme: expected, scheme: expected, color: THEME_COLORS[expected] })
      }
    }
  })

  it('sin elección guardada la página sale clara aunque el sistema esté en oscuro', () => {
    expect(run({ stored: null, dark: true }).theme).toBe('light')
    expect(run({ stored: 'rosa', dark: true }).theme).toBe('light')
    expect(run({ stored: 'auto', dark: true }).theme).toBe('dark')
    expect(run({ stored: 'dark', dark: false }).theme).toBe('dark')
  })

  it('si el almacenamiento está bloqueado no rompe la página (queda el tema por defecto del CSS)', () => {
    expect(() => run({ throws: true })).not.toThrow()
  })
})
