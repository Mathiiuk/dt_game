import { describe, it, expect } from 'vitest'
import { clubLeaders } from '../../src/domain/leaders'

const players = [
  { id: 'a', first_name: 'Lucas', last_name: 'Pérez', position: 'DEL' },
  { id: 'b', first_name: 'Mati', last_name: 'Gómez', position: 'MC' },
  { id: 'c', first_name: 'Nico', last_name: 'Ruiz', position: 'DFC' }
]
const rows = [
  { player_id: 'a', goals: 2, assists: 0, rating: 7.5 },
  { player_id: 'a', goals: 1, assists: 1, rating: 8 },
  { player_id: 'a', goals: 0, assists: 0, rating: 6.5 },
  { player_id: 'b', goals: 1, assists: 2, rating: 7 },
  { player_id: 'b', goals: 0, assists: 1, rating: 7 },
  { player_id: 'c', goals: 0, assists: 0, rating: 9 }
]

describe('líderes del club', () => {
  it('goleadores: suma goles por jugador y ordena de más a menos', () => {
    const { scorers } = clubLeaders(rows, players)
    expect(scorers.map(s => [s.name, s.goals])).toEqual([['Lucas Pérez', 3], ['Mati Gómez', 1]])
  })

  it('asistidores: suma asistencias y no lista a quien no dio ninguna', () => {
    const { assisters } = clubLeaders(rows, players)
    expect(assisters.map(s => [s.name, s.assists])).toEqual([['Mati Gómez', 3], ['Lucas Pérez', 1]])
  })

  it('mejor jugador: promedio de nota con un mínimo de partidos', () => {
    const { best } = clubLeaders(rows, players, { minMatchesForRating: 2 })
    expect(best.map(b => [b.name, b.rating])).toEqual([['Lucas Pérez', 7.3], ['Mati Gómez', 7]])
    expect(best.some(b => b.name === 'Nico Ruiz')).toBe(false)
  })

  it('si nadie llega al mínimo de partidos, igual muestra a los que jugaron', () => {
    const { best } = clubLeaders(rows, players, { minMatchesForRating: 10 })
    expect(best[0].name).toBe('Nico Ruiz')
  })

  it('respeta el límite, ignora filas sin jugador conocido y notas vacías', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ player_id: `p${i}`, goals: i + 1, assists: 0, rating: null }))
    const list = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, first_name: 'J', last_name: String(i) }))
    const out = clubLeaders([...many, { player_id: 'fantasma', goals: 99, assists: 0, rating: 5 }], list, { limit: 3 })
    expect(out.scorers).toHaveLength(3)
    expect(out.scorers[0].name).toBe('J 7')
    expect(out.best).toEqual([])
  })

  it('sin datos devuelve todo vacío', () => {
    expect(clubLeaders([], [])).toEqual({ scorers: [], assisters: [], best: [] })
    expect(clubLeaders(undefined, undefined)).toEqual({ scorers: [], assisters: [], best: [] })
  })
})
