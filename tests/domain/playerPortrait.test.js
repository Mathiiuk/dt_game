import { portraitOf, SKIN_TONES, HAIR_COLORS, HAIR_STYLES } from '../../src/domain/playerPortrait'

describe('retrato del jugador', () => {
  it('es siempre el mismo para el mismo jugador', () => {
    const a = { id: 'p1', first_name: 'Tomás', last_name: 'Luna', age: 22 }
    expect(portraitOf(a)).toEqual(portraitOf({ ...a }))
  })

  it('usa el id si lo hay y el nombre si no', () => {
    expect(portraitOf({ id: 'x1' })).toEqual(portraitOf({ id: 'x1', first_name: 'Otro' }))
    expect(portraitOf({ first_name: 'Ana', last_name: 'Gómez' })).toEqual(portraitOf({ first_name: 'Ana', last_name: 'Gómez' }))
  })

  it('siempre devuelve rasgos válidos, incluso sin datos', () => {
    const r = portraitOf(null)
    expect(SKIN_TONES).toContain(r.skin)
    expect(HAIR_COLORS).toContain(r.hair)
    expect(HAIR_STYLES).toContain(r.style)
  })

  it('la gente varía: entre 200 jugadores aparecen todos los peinados y varios tonos', () => {
    const rows = Array.from({ length: 200 }, (_, i) => portraitOf({ id: `jugador-${i}` }))
    expect(new Set(rows.map(r => r.style)).size).toBe(HAIR_STYLES.length)
    expect(new Set(rows.map(r => r.skin)).size).toBeGreaterThanOrEqual(4)
  })

  it('los jugadores mayores pueden tener canas y los juveniles no', () => {
    const olds = Array.from({ length: 200 }, (_, i) => portraitOf({ id: `v-${i}`, age: 38 }))
    const youth = Array.from({ length: 200 }, (_, i) => portraitOf({ id: `v-${i}`, age: 17 }))
    expect(olds.some(r => r.hair === '#c9c9c9')).toBe(true)
    expect(youth.some(r => r.hair === '#c9c9c9')).toBe(false)
  })
})
