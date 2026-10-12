import { readFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf8')

describe('movimiento de las novedades visuales', () => {
  it('define el sello y el pop con su animación', () => {
    expect(css).toContain('--animate-stamp-in:')
    expect(css).toContain('--animate-pop-in:')
    expect(css).toContain('@keyframes stamp-in')
    expect(css).toContain('@keyframes pop-in')
  })

  it('respeta "menos movimiento": todas las animaciones se reducen salvo las del juego', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toContain('animation-duration: 0.01ms !important')
    expect(reduced).toMatch(/\*:not\(\.penalty-marker\):not\(\.animate-chant-ring\)/)
  })
})
