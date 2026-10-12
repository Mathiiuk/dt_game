import { drawShareCard, drawMomentCard, cardPalette } from '../../src/lib/shareMatch'

const recorder = () => {
  const fills = []
  const texts = []
  const rects = []
  const ctx = new Proxy({}, {
    get: (_, k) => (k === 'fillText' ? (...a) => texts.push(a[0]) : k === 'fillRect' ? (...a) => rects.push(a) : () => {}),
    set: (_, k, v) => { if (k === 'fillStyle') fills.push(v); return true }
  })
  return { ctx, fills, texts, rects }
}
const match = { club: 'Club Atlético Potrero', rival: 'Los Pibes FC', mine: 3, theirs: 1 }
const moment = { headline: '¡CAMPEONES!', big: '2026', club: 'Club Atlético Potrero', sub: 'Temporada ganada', tone: 'gold' }

describe('paleta de las tarjetas', () => {
  afterEach(() => { delete document.documentElement.dataset.theme })

  it('el claro es papel de diario y el oscuro noche de redacción (los mismos colores del juego)', () => {
    expect(cardPalette('light').paper).toBe('#F5EFE0')
    expect(cardPalette('dark').paper).toBe('#101521')
    expect(cardPalette('light').ink).not.toBe(cardPalette('dark').ink)
  })

  it('sin pedirlo, sigue el tema que la persona está usando', () => {
    document.documentElement.dataset.theme = 'dark'
    expect(cardPalette().paper).toBe('#101521')
    document.documentElement.dataset.theme = 'light'
    expect(cardPalette().paper).toBe('#F5EFE0')
  })

  it('un tema desconocido cae en el claro', () => {
    expect(cardPalette('raro').paper).toBe('#F5EFE0')
  })
})

describe('tarjetas con formato de portada de diario', () => {
  it.each(['light', 'dark'])('el resultado (%s) pinta el fondo del tema y lleva cabezal, titular, marcador y sitio', (theme) => {
    const { ctx, fills, texts, rects } = recorder()
    drawShareCard(ctx, { ...match, theme })
    expect(fills[0]).toBe(cardPalette(theme).paper)
    expect(rects[0]).toEqual([0, 0, 1080, 1350])
    expect(texts).toEqual(expect.arrayContaining(['VESTUARIO', 'EL DIARIO DEL DT', '¡GANAMOS!', '3 - 1', 'Club Atlético Potrero', 'vs Los Pibes FC']))
    expect(texts.some(t => /vestuario\.com\.ar/.test(t))).toBe(true)
  })

  it('el momento (claro) lleva cabezal, titular, dato y club', () => {
    const { ctx, texts } = recorder()
    drawMomentCard(ctx, { ...moment, theme: 'light' })
    expect(texts).toEqual(expect.arrayContaining(['VESTUARIO', 'EL DIARIO DEL DT', '¡CAMPEONES!', '2026', 'Club Atlético Potrero', 'Temporada ganada']))
  })

  it('las tarjetas con la fecha del día no dependen de datos personales', () => {
    const { ctx, texts } = recorder()
    drawShareCard(ctx, { ...match, theme: 'light' })
    expect(texts.join(' ')).not.toMatch(/@|\bemail\b/i)
  })
})
