import { drawJersey, kitOf } from '../../src/lib/shareJersey'
import { drawShareCard, drawMomentCard } from '../../src/lib/shareMatch'

const recorder = () => {
  const calls = []
  const fills = []
  const ctx = new Proxy({}, {
    get: (_, k) => (k === 'fillText' ? () => {} : (...a) => calls.push([k, ...a])),
    set: (_, k, v) => { if (k === 'fillStyle') fills.push(v); return true }
  })
  return { ctx, calls, fills }
}

describe('camiseta en la tarjeta', () => {
  it('pinta la silueta con el color primario, recorta el estampado y lo pinta con el secundario', () => {
    const { ctx, calls, fills } = recorder()
    drawJersey(ctx, { x: 465, y: 190, size: 150, primary: '#112233', secondary: '#ffeedd', pattern: 'STRIPES_VERTICAL' })
    expect(fills).toEqual(expect.arrayContaining(['#112233', '#ffeedd']))
    expect(calls.some(c => c[0] === 'clip')).toBe(true)
    expect(calls.filter(c => c[0] === 'fillRect').length).toBeGreaterThanOrEqual(3)
    expect(calls.filter(c => c[0] === 'save')).toHaveLength(calls.filter(c => c[0] === 'restore').length)
  })

  it.each(['CENTER_STRIPE', 'STRIPES_VERTICAL', 'STRIPES_HORIZONTAL', 'SASH', 'HALVES', 'SOLID', undefined, 'RARO'])('el diseño %s no rompe', (pattern) => {
    const { ctx } = recorder()
    expect(() => drawJersey(ctx, { x: 0, y: 0, size: 100, primary: '#000', secondary: '#fff', pattern })).not.toThrow()
  })

  it('kitOf toma los colores y el diseño del club, con valores por defecto', () => {
    expect(kitOf({ primary_color: '#111', secondary_color: '#222', jersey_pattern: 'SASH' })).toEqual({ primary: '#111', secondary: '#222', pattern: 'SASH' })
    expect(kitOf(null)).toEqual({ primary: '#047857', secondary: '#FFFFFF', pattern: 'CENTER_STRIPE' })
  })

  it('las tarjetas de resultado y de momento dibujan la camiseta solo si reciben el kit', () => {
    const a = recorder(); drawShareCard(a.ctx, { club: 'X', rival: 'Y', mine: 1, theirs: 0, kit: { primary: '#123456', secondary: '#fff', pattern: 'HALVES' } })
    expect(a.fills).toContain('#123456')
    const b = recorder(); drawShareCard(b.ctx, { club: 'X', rival: 'Y', mine: 1, theirs: 0 })
    expect(b.calls.some(c => c[0] === 'clip')).toBe(false)
    const c = recorder(); drawMomentCard(c.ctx, { headline: 'H', big: '1', club: 'X', sub: 's', tone: 'gold', kit: { primary: '#654321', secondary: '#fff' } })
    expect(c.fills).toContain('#654321')
  })
})
