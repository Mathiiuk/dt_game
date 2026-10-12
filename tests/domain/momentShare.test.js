import { describe, it, expect } from 'vitest'
import { momentCard, momentUrl } from '../../src/domain/momentShare'

describe('momentos para compartir', () => {
  it('campeón: titular, club, temporada y texto con el enlace a la demo', () => {
    const c = momentCard({ kind: 'champion', club: 'Club Atlético Potrero', season: 2027 })
    expect(c.headline).toMatch(/CAMPE/)
    expect(c.big).toBe('2027')
    expect(c.club).toBe('Club Atlético Potrero')
    expect(c.text).toContain('Club Atlético Potrero')
    expect(c.text).toContain(momentUrl('champion'))
  })

  it('ascenso: dice a qué categoría subió', () => {
    const c = momentCard({ kind: 'promotion', club: 'Potrero', season: 2027, tierName: 'Primera Nacional' })
    expect(c.headline).toMatch(/ASCENSO/)
    expect(c.big).toBe('Primera Nacional')
  })

  it('fichaje: muestra el jugador y el monto', () => {
    const c = momentCard({ kind: 'signing', club: 'Potrero', player: 'Álvaro Medina', fee: 4200 })
    expect(c.headline).toMatch(/FICHAJE/)
    expect(c.big).toBe('Álvaro Medina')
    expect(c.sub).toContain('$4.200')
  })

  it('temporada: puesto final y titular de la historia', () => {
    const c = momentCard({ kind: 'season', club: 'Potrero', season: 2027, position: 3, storyHeadline: 'Un año para recordar' })
    expect(c.big).toBe('3º')
    expect(c.sub).toBe('Un año para recordar')
  })

  it('el enlace marca el origen y el tipo de momento', () => {
    expect(momentUrl('champion')).toContain('/demo?utm_source=share&utm_medium=champion')
  })

  it('un tipo desconocido cae en el de temporada sin romper', () => {
    expect(momentCard({ kind: 'otro', club: 'X' }).headline).toBeTruthy()
  })
})

describe('momento: reto del día', () => {
  it('muestra el puntaje y el puesto entre los que jugaron', () => {
    const c = momentCard({ kind: 'daily', club: 'Potrero', score: 265, rank: 2, players: 9 })
    expect(c.headline).toBe('RETO DEL DÍA')
    expect(c.big).toBe('265 pts')
    expect(c.sub).toBe('Puesto 2 de 9')
    expect(c.text).toContain(momentUrl('daily'))
  })
})
