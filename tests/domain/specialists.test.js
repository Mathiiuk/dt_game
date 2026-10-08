import { describe, it, expect } from 'vitest'
import { specialistsOf, topFor, isSpecialist, cleanTakers, ROLE_LABELS } from '../../src/domain/specialists'

const p = (id, position, attrs = {}) => ({ id, first_name: id.toUpperCase(), last_name: 'Prueba', position, attr_overall: 60, ...attrs })

describe('especialistas de pelota parada', () => {
  const squad = [
    p('arq', 'GK', { attr_finishing: 99, attr_passing: 99 }),
    p('nueve', 'DC', { attr_finishing: 85, attr_shooting: 80, attr_passing: 55, attr_vision: 50 }),
    p('diez', 'MC', { attr_finishing: 60, attr_shooting: 75, attr_passing: 88, attr_vision: 90 }),
    p('zaguero', 'DFC', { attr_overall: 72, attr_defending: 85, attr_finishing: 40 }),
    p('herido', 'MC', { attr_passing: 99, attr_vision: 99, is_injured: true })
  ]
  const sp = specialistsOf(squad)

  it('cada rol tiene su mejor jugador, sin arqueros ni lesionados', () => {
    expect(sp.PENALTY.id).toBe('nueve')
    expect(sp.CORNER.id).toBe('diez')
    expect(sp.FREE_KICK.id).toBe('diez')
    expect(Object.values(sp).every(s => s.id !== 'arq' && s.id !== 'herido')).toBe(true)
    expect(sp.PENALTY.name).toBe('NUEVE Prueba')
  })

  it('el cabeceador es alguien de área y los roles tienen nombre para mostrar', () => {
    expect(['zaguero', 'nueve']).toContain(sp.HEADER.id)
    expect(Object.keys(ROLE_LABELS).sort()).toEqual(Object.keys(sp).sort())
  })

  it('devuelve los mejores de un rol con el especialista primero', () => {
    const top = topFor(squad, 'CORNER', 2)
    expect(top.map(x => x.id)).toEqual(['diez', 'nueve'].filter(Boolean).slice(0, 2).map((_, i) => top[i].id))
    expect(top[0].id).toBe('diez')
    expect(isSpecialist(sp, 'CORNER', 'diez')).toBe(true)
    expect(isSpecialist(sp, 'CORNER', 'nueve')).toBe(false)
  })

  it('con un plantel vacío no rompe', () => {
    expect(specialistsOf([]).PENALTY).toBeNull()
  })
})

describe('especialistas elegidos a mano', () => {
  const squad = [
    p('arq', 'GK'),
    p('nueve', 'DC', { attr_finishing: 85, attr_shooting: 80, attr_passing: 55, attr_vision: 50 }),
    p('diez', 'MC', { attr_finishing: 60, attr_shooting: 75, attr_passing: 88, attr_vision: 90 }),
    p('lateral', 'LI', { attr_finishing: 30, attr_shooting: 30, attr_passing: 45, attr_vision: 40 })
  ]

  it('lo elegido a mano manda por sobre los atributos', () => {
    const sp = specialistsOf(squad, { PENALTY: 'lateral' })
    expect(sp.PENALTY).toMatchObject({ id: 'lateral', manual: true })
    expect(sp.CORNER).toMatchObject({ id: 'diez', manual: false })
    expect(topFor(squad, 'PENALTY', 2, { PENALTY: 'lateral' })[0].id).toBe('lateral')
  })

  it('si el elegido no puede jugar (lesionado, arquero o no está) vuelve el automático', () => {
    const hurt = squad.map(x => (x.id === 'lateral' ? { ...x, is_injured: true } : x))
    expect(specialistsOf(hurt, { PENALTY: 'lateral' }).PENALTY.id).toBe('nueve')
    expect(specialistsOf(squad, { PENALTY: 'arq' }).PENALTY.id).toBe('nueve')
    expect(specialistsOf(squad, { PENALTY: 'fantasma' }).PENALTY.manual).toBe(false)
  })

  it('al guardar sólo quedan roles conocidos con un id', () => {
    expect(cleanTakers({ PENALTY: 'a', CORNER: '', INVENTADO: 'x', HEADER: 5 })).toEqual({ PENALTY: 'a' })
    expect(cleanTakers({})).toBeNull()
    expect(cleanTakers(null)).toBeNull()
  })
})
