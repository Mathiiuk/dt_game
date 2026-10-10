import { describe, it, expect } from 'vitest'
import { squadRows, squadsInsertSql } from '../../src/domain/realSquads'

const players = (n) => Array.from({ length: n }, (_, i) => ({ name: `Jugador ${i}`, pos: i < 4 ? 'DEL' : 'MED' }))
const data = {
  source: 'Wikipedia (es), CC BY-SA 4.0; nombres cambiados',
  clubs: {
    'River Plate': { page: 'Club Atlético River Plate', players: players(12) },
    "Newell's Old Boys": { page: "Club Atlético Newell's Old Boys", players: [{ name: "Dante D'Alessio", pos: 'DEL' }, ...players(11)] },
    'Sin Página': null,
    'Corto FC': { page: 'Corto', players: players(5) }
  }
}

describe('filas de planteles para la base', () => {
  const rows = squadRows(data)

  it('una fila por plaza (0 a 11) de cada club con plantel completo', () => {
    expect(rows.filter(r => r.club === 'River Plate').map(r => r.slot)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(rows).toHaveLength(24)
  })

  it('los clubes sin página o con menos de 12 jugadores no entran (se usa el plantel derivado de siempre)', () => {
    const clubs = new Set(rows.map(r => r.club))
    expect(clubs.has('Sin Página')).toBe(false)
    expect(clubs.has('Corto FC')).toBe(false)
  })

  it('guarda el nombre cambiado, el puesto y la fuente', () => {
    expect(rows[0]).toMatchObject({ club: 'River Plate', slot: 0, name: 'Jugador 0', pos: 'DEL', page: 'Club Atlético River Plate' })
  })

  it('sin datos devuelve una lista vacía', () => {
    expect(squadRows(null)).toEqual([])
    expect(squadRows({ clubs: {} })).toEqual([])
  })
})

describe('SQL de carga', () => {
  const rows = squadRows(data)

  it('escapa las comillas simples de nombres de clubes y de jugadores', () => {
    const sql = squadsInsertSql(rows).join('\n')
    expect(sql).toContain("'Newell''s Old Boys'")
    expect(sql).toContain("'Dante D''Alessio'")
  })

  it('reparte en tandas chicas y es idempotente (on conflict)', () => {
    const batches = squadsInsertSql(rows, 10)
    expect(batches).toHaveLength(3)
    for (const b of batches) expect(b).toMatch(/on conflict \(club_name, slot\) do update/)
  })

  it('sin filas no genera nada', () => {
    expect(squadsInsertSql([])).toEqual([])
  })
})
