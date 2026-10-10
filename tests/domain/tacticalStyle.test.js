import { describe, it, expect } from 'vitest'
import { tacticMultipliers, describeEffect, effectOf, TACTIC_PRESETS, presetOf } from '../../src/domain/tacticalStyle'

const t = (over = {}) => ({ mentality: 'BALANCED', passing_style: 'MIXED', tempo: 'NORMAL', pressing_intensity: 'BALANCED', ...over })

describe('efectos de las instrucciones tácticas', () => {
  it('equilibrado y normal no mueve nada', () => {
    expect(tacticMultipliers(t())).toEqual({ attack: 1, defense: 1, midfield: 1, fitnessDrain: 0.35 })
  })

  it('la mentalidad cambia ataque y defensa, incluida la muy defensiva', () => {
    expect(tacticMultipliers(t({ mentality: 'ATTACKING' }))).toMatchObject({ attack: 1.2, defense: 0.85 })
    expect(tacticMultipliers(t({ mentality: 'DEFENSIVE' }))).toMatchObject({ attack: 0.8, defense: 1.2 })
    expect(tacticMultipliers(t({ mentality: 'ALL_OUT_ATTACK' }))).toMatchObject({ attack: 1.35, defense: 0.7 })
    expect(tacticMultipliers(t({ mentality: 'VERY_DEFENSIVE' }))).toMatchObject({ attack: 0.7, defense: 1.3 })
  })

  it('el ritmo cambia el desgaste físico', () => {
    expect(tacticMultipliers(t({ tempo: 'FAST' }))).toMatchObject({ attack: 1.12, fitnessDrain: 0.55 })
    expect(tacticMultipliers(t({ tempo: 'SLOW' }))).toMatchObject({ defense: 1.08, fitnessDrain: 0.22 })
  })

  it('la presión alta gana el mediocampo y cansa más; el repliegue defiende mejor y cansa menos', () => {
    const alta = tacticMultipliers(t({ pressing_intensity: 'AGGRESSIVE' }))
    expect(alta.midfield).toBeGreaterThan(1)
    expect(alta.fitnessDrain).toBeGreaterThan(0.35)
    const baja = tacticMultipliers(t({ pressing_intensity: 'STAND_OFF' }))
    expect(baja.defense).toBeGreaterThan(1)
    expect(baja.attack).toBeLessThan(1)
    expect(baja.fitnessDrain).toBeLessThan(0.35)
  })

  it('el estilo de pase mueve el mediocampo y el ataque', () => {
    expect(tacticMultipliers(t({ passing_style: 'SHORT_TIKI' })).midfield).toBeGreaterThan(1)
    const directo = tacticMultipliers(t({ passing_style: 'DIRECT' }))
    expect(directo.attack).toBeGreaterThan(1)
    expect(directo.midfield).toBeLessThan(1)
    expect(tacticMultipliers(t({ passing_style: 'LONG_BALL' })).midfield).toBeLessThan(directo.midfield)
  })

  it('los efectos se combinan multiplicando', () => {
    const m = tacticMultipliers(t({ mentality: 'ATTACKING', tempo: 'FAST' }))
    expect(m.attack).toBeCloseTo(1.2 * 1.12, 5)
  })

  it('acepta los nombres viejos en castellano y no se rompe con valores desconocidos o vacíos', () => {
    expect(tacticMultipliers({ mentality: 'Ofensiva', tempo: 'Alto' })).toMatchObject({ attack: 1.2 * 1.12, defense: 0.85, fitnessDrain: 0.55 })
    expect(tacticMultipliers({ mentality: 'Defensiva', tempo: 'Lento' })).toMatchObject({ attack: 0.8 })
    expect(tacticMultipliers({ mentality: 'RARA' })).toEqual({ attack: 1, defense: 1, midfield: 1, fitnessDrain: 0.35 })
    expect(tacticMultipliers()).toEqual({ attack: 1, defense: 1, midfield: 1, fitnessDrain: 0.35 })
  })
})

describe('cómo se cuenta cada instrucción', () => {
  it('dice el efecto con porcentajes claros', () => {
    expect(effectOf('mentality', 'ATTACKING')).toBe('+20 % ataque, −15 % defensa')
    expect(effectOf('mentality', 'BALANCED')).toBe('Sin cambios: el equipo juega como es')
    expect(effectOf('tempo', 'FAST')).toBe('+12 % ataque, más desgaste físico')
    expect(effectOf('tempo', 'SLOW')).toBe('+8 % defensa, menos desgaste físico')
    expect(effectOf('pressing', 'AGGRESSIVE')).toMatch(/mediocampo.*más desgaste/)
    expect(effectOf('passing', 'DIRECT')).toMatch(/ataque/)
  })

  it('describeEffect resume cualquier combinación', () => {
    expect(describeEffect({ attack: 1.35, defense: 0.7, midfield: 1, fitnessDrain: 0.35 })).toBe('+35 % ataque, −30 % defensa')
    expect(describeEffect({ attack: 1, defense: 1, midfield: 1, fitnessDrain: 0.35 })).toBe('Sin cambios: el equipo juega como es')
  })
})

describe('estilos listos para usar', () => {
  it('hay cinco y cada uno fija las cuatro instrucciones', () => {
    expect(TACTIC_PRESETS.map(p => p.id)).toEqual(['EQUILIBRADO', 'POSESION', 'CONTRAATAQUE', 'TODO_ARRIBA', 'CERRAR'])
    for (const p of TACTIC_PRESETS) {
      expect(Object.keys(p.values).sort()).toEqual(['mentality', 'passing_style', 'pressing_intensity', 'tempo'])
      expect(p.description.length).toBeGreaterThan(10)
    }
  })

  it('reconoce cuál está activo, o ninguno si se tocó algo suelto', () => {
    const contra = TACTIC_PRESETS.find(p => p.id === 'CONTRAATAQUE').values
    expect(presetOf(contra)).toBe('CONTRAATAQUE')
    expect(presetOf({ ...contra, tempo: 'SLOW' })).toBeNull()
  })

  it('cada estilo tiene un balance coherente con su idea', () => {
    const by = (id) => tacticMultipliers(TACTIC_PRESETS.find(p => p.id === id).values)
    expect(by('TODO_ARRIBA').attack).toBeGreaterThan(by('EQUILIBRADO').attack)
    expect(by('CERRAR').defense).toBeGreaterThan(by('EQUILIBRADO').defense)
    expect(by('CERRAR').fitnessDrain).toBeLessThan(by('TODO_ARRIBA').fitnessDrain)
  })
})
