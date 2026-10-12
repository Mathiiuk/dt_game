// Contraste WCAG AA de los pares de color que de verdad se usan, en el tema claro y en el oscuro.
// Lee los tokens de src/index.css (hex) para que nadie los cambie sin que se verifique.
import { readFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf8')

/** Lee `--color-xxx: #hex;` de un bloque identificado por su selector */
const tokensOf = (selectorStart) => {
  const i = css.indexOf(selectorStart)
  if (i < 0) throw new Error(`no encuentro ${selectorStart}`)
  const block = css.slice(i, css.indexOf('}', i))
  return Object.fromEntries([...block.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m => [m[1], m[2]]))
}

const light = tokensOf('@theme {')
const dark = { ...light, ...tokensOf(':root[data-theme="dark"] {') }

const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const luminance = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255) }
const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05) }

// [texto, fondo, mínimo]: 4,5 texto normal; 3 para texto grande o componentes de interfaz
const PAIRS = [
  ['fg', 'bg', 4.5], ['fg', 'surface', 4.5], ['fg', 'surface-2', 4.5], ['fg', 'surface-3', 4.5],
  ['fg-muted', 'bg', 4.5], ['fg-muted', 'surface', 4.5], ['fg-muted', 'surface-2', 4.5],
  ['fg-subtle', 'bg', 4.5], ['fg-subtle', 'surface', 4.5],
  ['primary', 'bg', 4.5], ['primary', 'surface', 4.5], ['primary-fg', 'primary', 4.5], ['primary-fg', 'primary-strong', 4.5],
  ['accent', 'bg', 4.5], ['accent', 'surface', 4.5], ['accent-fg', 'accent', 4.5],
  ['danger', 'bg', 4.5], ['danger', 'surface', 4.5], ['danger-fg', 'danger', 4.5],
  ['warning', 'bg', 4.5], ['warning', 'surface', 4.5], ['warning-fg', 'warning', 4.5],
  ['gold', 'bg', 4.5], ['gold', 'surface', 4.5], ['gold-fg', 'gold', 4.5],
  ['line-strong', 'bg', 1.4], ['primary', 'surface-2', 4.5]
]

describe.each([['claro', light], ['oscuro', dark]])('contraste AA en el tema %s', (_name, t) => {
  it.each(PAIRS)('%s sobre %s ≥ %s:1', (fg, bg, min) => {
    expect(t[fg], `falta --color-${fg}`).toBeDefined()
    expect(t[bg], `falta --color-${bg}`).toBeDefined()
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min)
  })
})

describe('tokens del diseño', () => {
  it('los dos temas definen los mismos tokens y usan los colores del boceto', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort())
    expect(light.bg.toLowerCase()).toBe('#f5efe0')
    expect(light.fg.toLowerCase()).toBe('#14213d')
    expect(light.primary.toLowerCase()).toBe('#1f4e9d')
    expect(dark.bg.toLowerCase()).toBe('#101521')
    expect(dark.primary.toLowerCase()).toBe('#7fa8ff')
  })
})
