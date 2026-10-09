import { describe, it, expect } from 'vitest'
import { pressEcho, echoCode, echoChance, hasEcho, shortQuote, ECHO_CODE_PREFIX } from '../../src/domain/pressEcho'

const base = { outcome: 'L', journalist: 'Esteban Valenzuela', outlet: 'Diario El Potrero', quote: 'Les voy a decir cuatro cosas.', rival: 'Huracán' }

describe('el eco de la prensa', () => {
  it('cada tono con carácter deja un evento con 3 opciones y efectos propios', () => {
    for (const tone of ['COMBATIVE', 'PRAISING', 'SELF_CRITICAL']) {
      const ev = pressEcho({ ...base, tone })
      expect(ev.template_code).toBe(echoCode(tone))
      expect(ev.template_code.startsWith(ECHO_CODE_PREFIX)).toBe(true)
      expect(ev.category).toBe('BOARD_PRESS')
      expect(ev.severity).toBe('MEDIUM')
      expect(ev.options).toHaveLength(3)
      expect(new Set(ev.options.map(o => o.id)).size).toBe(3)
      expect(ev.options.every(o => o.cost === 0 && Object.keys(o.effects).length > 0)).toBe(true)
    }
  })

  it('el pragmático no deja eco', () => {
    expect(pressEcho({ ...base, tone: 'PRAGMATIC' })).toBeNull()
    expect(pressEcho({ ...base, tone: 'INVENTADO' })).toBeNull()
    expect(echoChance('PRAGMATIC')).toBe(0)
  })

  it('la historia nombra al periodista, el medio, el rival y la frase, y recuerda cómo terminó el partido', () => {
    const ev = pressEcho({ ...base, tone: 'COMBATIVE' })
    expect(ev.title).toContain('Diario El Potrero')
    expect(ev.description).toContain('Esteban Valenzuela')
    expect(ev.description).toContain('Huracán')
    expect(ev.description).toContain('“Les voy a decir cuatro cosas.”')
    expect(ev.description).toContain('la derrota')
    expect(pressEcho({ ...base, tone: 'COMBATIVE', outcome: 'W' }).description).toContain('la victoria')
    expect(pressEcho({ ...base, tone: 'COMBATIVE', outcome: 'D' }).description).toContain('el empate')
  })

  it('las frases largas se recortan', () => {
    const long = 'a'.repeat(300)
    expect(shortQuote(long).length).toBeLessThanOrEqual(90)
    expect(shortQuote(long).endsWith('…')).toBe(true)
    expect(shortQuote('  hola   mundo ')).toBe('hola mundo')
  })

  it('lo combativo tiene más chance de eco que lo prolijo, y el azar se inyecta', () => {
    expect(echoChance('COMBATIVE')).toBeGreaterThan(echoChance('PRAISING'))
    expect(hasEcho('COMBATIVE', () => 0.5)).toBe(true)
    expect(hasEcho('COMBATIVE', () => 0.9)).toBe(false)
    expect(hasEcho('PRAGMATIC', () => 0)).toBe(false)
  })
})
