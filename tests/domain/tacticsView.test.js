import { styleName, styleLine, hasChanges } from '../../src/domain/tacticsView'
import { TACTIC_PRESETS } from '../../src/domain/tacticalStyle'

const of = (p) => p.values

describe('resumen del estilo de juego', () => {
  it('un estilo listo se muestra con su nombre', () => {
    for (const p of TACTIC_PRESETS) expect(styleName(of(p))).toBe(p.label)
  })

  it('si se tocó algo suelto dice "Personalizado" y la mentalidad', () => {
    expect(styleName({ mentality: 'ATTACKING', passing_style: 'MIXED', tempo: 'NORMAL', pressing_intensity: 'BALANCED' })).toBe('Personalizado · ofensivo')
    expect(styleName({ mentality: 'VERY_DEFENSIVE', passing_style: 'MIXED', tempo: 'FAST', pressing_intensity: 'BALANCED' })).toBe('Personalizado · muy defensivo')
    expect(styleName({})).toBe('Equilibrado')
  })

  it('la línea de efecto cuenta lo que pasa en el partido con las mismas cuentas del motor', () => {
    expect(styleLine({ mentality: 'ATTACKING', tempo: 'NORMAL', pressing_intensity: 'BALANCED', passing_style: 'MIXED' })).toBe('+20 % ataque, −15 % defensa')
    expect(styleLine({})).toMatch(/Sin cambios/)
  })

  it('hay cambios sin guardar cuando la foto actual difiere de la guardada', () => {
    expect(hasChanges('a', 'a', false)).toBe(false)
    expect(hasChanges('a', 'b', false)).toBe(true)
    expect(hasChanges('a', 'b', true)).toBe(false)
  })
})
