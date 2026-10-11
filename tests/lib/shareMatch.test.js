import { drawShareCard, shareMatchResult } from '../../src/lib/shareMatch'

const recorder = () => {
  const calls = []
  const ctx = new Proxy({}, { get: (_, k) => (k === 'fillText' ? (...a) => calls.push(a) : () => {}), set: () => true })
  return { ctx, calls }
}
const data = { club: 'Club Atlético Potrero', rival: 'Los Pibes FC', mine: 2, theirs: 1 }

describe('tarjeta del resultado', () => {
  it('escribe la marca, el resultado, el marcador, los dos equipos y el sitio', () => {
    const { ctx, calls } = recorder()
    drawShareCard(ctx, data)
    const texts = calls.map(c => c[0])
    expect(texts).toEqual(expect.arrayContaining(['VESTUARIO', '¡GANAMOS!', '2 - 1', 'Club Atlético Potrero', 'vs Los Pibes FC']))
    expect(texts.some(t => /vestuario\.com\.ar/.test(t))).toBe(true)
  })
})

describe('compartir el resultado', () => {
  const doc = { createElement: () => ({ width: 0, height: 0, getContext: () => null }) }

  it('sin compartir del sistema copia el texto al portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue()
    expect(await shareMatchResult(data, { doc, nav: { clipboard: { writeText } } })).toBe('copied')
    expect(writeText.mock.calls[0][0]).toContain('Club Atlético Potrero 2 - 1 Los Pibes FC')
  })

  it('con compartir del sistema y sin poder mandar imágenes, comparte texto y enlace', async () => {
    const share = vi.fn().mockResolvedValue()
    expect(await shareMatchResult(data, { doc, nav: { share } })).toBe('shared')
    expect(share.mock.calls[0][0]).toMatchObject({ title: 'Vestuario', url: expect.stringContaining('utm_source=share') })
  })

  it('con imágenes permitidas manda el archivo con el texto', async () => {
    const share = vi.fn().mockResolvedValue()
    const canvas = { width: 0, height: 0, getContext: () => recorder().ctx, toBlob: (cb) => cb(new Blob(['x'], { type: 'image/png' })) }
    const out = await shareMatchResult(data, { doc: { createElement: () => canvas }, nav: { share, canShare: () => true } })
    expect(out).toBe('shared')
    expect(share.mock.calls[0][0].files[0].name).toBe('resultado-vestuario.png')
    expect(share.mock.calls[0][0].text).toContain('Probalo gratis')
  })

  it('si la persona cancela no pasa nada', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }))
    expect(await shareMatchResult(data, { doc, nav: { share } })).toBe('cancelled')
  })
})
