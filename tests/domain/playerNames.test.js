import { describe, it, expect } from 'vitest'
import { alterName, pickSquad, positionGroup } from '../../src/domain/playerNames'

describe('nombres cambiados de los planteles reales', () => {
  it('el mismo nombre real siempre da el mismo nombre cambiado', () => {
    expect(alterName('Ezequiel Centurión')).toBe(alterName('Ezequiel Centurión'))
  })

  it('el resultado nunca es el nombre real, ni el nombre ni el apellido', () => {
    const names = ['Ezequiel Centurión', 'Santiago Beltrán', 'Jeremías Martinet', 'Tobías Ramírez', 'Lionel Messi', 'Julián Álvarez', 'Enzo Pérez', 'Luis Advíncula', 'Ángel Di María', 'Paulo Díaz', 'Leandro Paredes']
    for (const real of names) {
      const altered = alterName(real)
      const [rf, ...rl] = real.split(' ')
      const [af, ...al] = altered.split(' ')
      expect(altered, real).not.toBe(real)
      expect(af, real).not.toBe(rf)
      expect(al.join(' '), real).not.toBe(rl.join(' '))
      expect(altered.split(' ').length).toBe(real.split(' ').length)
    }
  })

  it('parece un nombre argentino: empieza en mayúscula y sin símbolos raros', () => {
    for (const real of ['Ezequiel Centurión', 'Nicolás De La Cruz', 'Franco Armani', 'José Sand']) {
      const altered = alterName(real)
      expect(altered).toMatch(/^[A-ZÁÉÍÓÚÑ][\p{L}'. -]+$/u)
      for (const part of altered.split(' ')) expect(part[0]).toBe(part[0].toUpperCase())
    }
  })

  it('distintos jugadores dan distintos nombres', () => {
    const set = new Set(['Franco Armani', 'Franco Mastantuono', 'Facundo Colidio', 'Maximiliano Meza', 'Marcos Acuña', 'Gonzalo Montiel'].map(alterName))
    expect(set.size).toBe(6)
  })

  it('un nombre de una sola palabra o vacío no se rompe', () => {
    expect(alterName('Neymar')).not.toBe('Neymar')
    expect(alterName('')).toBe('')
    expect(alterName(null)).toBe('')
  })
})

describe('puestos', () => {
  it('agrupa los puestos de la página en cuatro líneas', () => {
    expect(positionGroup('ARQ')).toBe('GK')
    expect(positionGroup('DEF')).toBe('DEF')
    expect(positionGroup('MED')).toBe('MID')
    expect(positionGroup('DEL')).toBe('FW')
    expect(positionGroup('MC')).toBe('MID')
    expect(positionGroup('')).toBe('MID')
  })
})

describe('doce de plantilla', () => {
  const mk = (n, pos) => Array.from({ length: n }, (_, i) => ({ name: `${pos}${i}`, pos, num: i + 1 }))
  const squad = [...mk(3, 'ARQ'), ...mk(8, 'DEF'), ...mk(8, 'MED'), ...mk(6, 'DEL')]

  it('elige 12 con los delanteros primero (los que más gol hacen), luego medios, defensores y arquero', () => {
    const twelve = pickSquad(squad)
    expect(twelve).toHaveLength(12)
    expect(twelve.slice(0, 4).every(p => p.pos === 'DEL')).toBe(true)
    expect(twelve.slice(4, 8).every(p => p.pos === 'MED')).toBe(true)
    expect(twelve.slice(8, 11).every(p => p.pos === 'DEF')).toBe(true)
    expect(twelve[11].pos).toBe('ARQ')
  })

  it('completa con otros puestos si falta alguno y no repite jugadores', () => {
    const few = [...mk(1, 'ARQ'), ...mk(10, 'DEF'), ...mk(2, 'MED')]
    const twelve = pickSquad(few)
    expect(twelve).toHaveLength(12 > few.length ? few.length : 12)
    expect(new Set(twelve.map(p => p.name)).size).toBe(twelve.length)
  })

  it('con menos de 12 devuelve lo que hay', () => {
    expect(pickSquad(mk(5, 'DEL'))).toHaveLength(5)
    expect(pickSquad([])).toEqual([])
  })
})
