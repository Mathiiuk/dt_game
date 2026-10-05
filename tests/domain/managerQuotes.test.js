import { MANAGER_QUOTES, FALLBACK_QUOTE } from '../../src/data/managerQuotes'
import { publishableQuotes, nextQuoteIndex, visibleMs, QUOTE_TIMING } from '../../src/features/home/quoteCycle'

describe('dataset de frases de DT', () => {
  it('los ids son únicos y cada frase declara su tipo', () => {
    const ids = MANAGER_QUOTES.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of MANAGER_QUOTES) expect(['historical', 'original']).toContain(q.type)
  })

  it('toda frase histórica aprobada tiene autor, medio y URL de la fuente', () => {
    const live = MANAGER_QUOTES.filter(q => q.type === 'historical' && q.approvedForProduction)
    expect(live.length).toBeGreaterThan(0)
    for (const q of live) {
      expect(q.verified).toBe(true)
      expect(q.manager).toBeTruthy()
      expect(q.sourceName).toBeTruthy()
      expect(q.sourceUrl).toMatch(/^https:\/\//)
    }
  })

  it('las frases propias de Vestuario no se atribuyen a nadie', () => {
    for (const q of MANAGER_QUOTES.filter(q => q.type === 'original')) expect(q.manager).toBeUndefined()
  })

  it('nada sin verificar queda aprobado para producción', () => {
    expect(MANAGER_QUOTES.filter(q => q.approvedForProduction && !q.verified)).toEqual([])
  })
})

describe('publicación de frases', () => {
  const base = { text: 'Frase', manager: 'DT', sourceUrl: 'https://medio.com/nota', sourceName: 'Medio', type: 'historical' }

  it('sólo salen las verificadas y aprobadas', () => {
    const list = publishableQuotes([
      { ...base, id: 'ok', verified: true, approvedForProduction: true },
      { ...base, id: 'sin-verificar', verified: false, approvedForProduction: true },
      { ...base, id: 'sin-aprobar', verified: true, approvedForProduction: false }
    ])
    expect(list.map(q => q.id)).toEqual(['ok'])
  })

  it('una histórica sin fuente no se publica aunque esté marcada como verificada', () => {
    const list = publishableQuotes([{ ...base, id: 'sin-fuente', sourceUrl: undefined, verified: true, approvedForProduction: true }])
    expect(list).toEqual([FALLBACK_QUOTE])
  })

  it('a una frase propia se le quita cualquier nombre que le hayan puesto', () => {
    const [q] = publishableQuotes([{ id: 'propia', text: 'Frase', manager: 'Alguien real', type: 'original', verified: true, approvedForProduction: true }])
    expect(q.manager).toBeUndefined()
  })

  it('sin frases publicables queda la de respaldo', () => {
    expect(publishableQuotes([])).toEqual([FALLBACK_QUOTE])
    expect(publishableQuotes(undefined)).toEqual([FALLBACK_QUOTE])
  })

  it('las pendientes del dataset real no aparecen', () => {
    const ids = publishableQuotes(MANAGER_QUOTES).map(q => q.id)
    expect(ids).not.toContain('menotti-eficacia-belleza')
    expect(ids).not.toContain('cruyff-futbol-sencillo')
    expect(ids.length).toBeGreaterThanOrEqual(5)
  })
})

describe('ciclo de frases', () => {
  it('nunca repite la misma frase dos veces seguidas', () => {
    for (const random of [() => 0, () => 0.5, () => 0.999]) {
      for (let total = 2; total <= 7; total++) {
        for (let current = 0; current < total; current++) {
          const next = nextQuoteIndex(current, total, random)
          expect(next).not.toBe(current)
          expect(next).toBeGreaterThanOrEqual(0)
          expect(next).toBeLessThan(total)
        }
      }
    }
  })

  it('con una sola frase se queda en ella', () => {
    expect(nextQuoteIndex(0, 1)).toBe(0)
  })

  it('el tiempo en pantalla respeta el rango y crece con el largo', () => {
    expect(visibleMs('Corta.')).toBe(QUOTE_TIMING.visibleMin)
    expect(visibleMs('x'.repeat(300))).toBe(QUOTE_TIMING.visibleMax)
    expect(visibleMs('x'.repeat(40))).toBeGreaterThan(visibleMs('x'.repeat(20)))
  })
})
