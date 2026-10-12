import { JERSEY_PATTERNS, DEFAULT_JERSEY_PATTERN, normalizeJerseyPattern } from '../../src/domain/jerseyKits'

describe('diseños de camiseta', () => {
  it('ofrece seis diseños con id único y nombre', () => {
    expect(JERSEY_PATTERNS).toHaveLength(6)
    expect(new Set(JERSEY_PATTERNS.map(p => p.id)).size).toBe(6)
    JERSEY_PATTERNS.forEach(p => expect(p.label.length).toBeGreaterThan(2))
  })

  it('un valor desconocido, vacío o nulo vuelve al diseño por defecto (clubes existentes)', () => {
    expect(normalizeJerseyPattern(null)).toBe(DEFAULT_JERSEY_PATTERN)
    expect(normalizeJerseyPattern('')).toBe(DEFAULT_JERSEY_PATTERN)
    expect(normalizeJerseyPattern('MALO')).toBe(DEFAULT_JERSEY_PATTERN)
  })

  it('respeta un diseño válido', () => {
    expect(normalizeJerseyPattern('HALVES')).toBe('HALVES')
  })

  it('el diseño por defecto es la franja central de siempre', () => {
    expect(DEFAULT_JERSEY_PATTERN).toBe('CENTER_STRIPE')
  })
})
