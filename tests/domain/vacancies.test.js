import { pickVacancies } from '../../src/domain/vacancies'

const club = (i, tier, chance) => ({ id: `c${i}`, tier, chance })

describe('bolsa de trabajo', () => {
  it('muestra primero lo que el DT puede conseguir y, dentro de eso, la categoría más alta', () => {
    const list = [club(1, 1, 'CASI IMPOSIBLE'), club(2, 5, 'MUY ALTA'), club(3, 4, 'MUY ALTA'), club(4, 3, 'CANDIDATO FIRME'), club(5, 2, 'POCAS OPCIONES')]
    expect(pickVacancies(list).map(c => c.id)).toEqual(['c3', 'c2', 'c4', 'c5', 'c1'])
  })

  it('hay variedad de divisiones: ninguna ocupa más de 5 lugares', () => {
    const list = [...Array.from({ length: 12 }, (_, i) => club(i, 5, 'MUY ALTA')), ...Array.from({ length: 6 }, (_, i) => club(100 + i, 4, 'MUY ALTA'))]
    const picked = pickVacancies(list, 15, 5)
    expect(picked.filter(c => c.tier === 5)).toHaveLength(5)
    expect(picked.filter(c => c.tier === 4)).toHaveLength(5)
  })

  it('respeta el máximo de 15 y no rompe con una lista vacía', () => {
    const list = Array.from({ length: 60 }, (_, i) => club(i, (i % 5) + 1, 'MUY ALTA'))
    expect(pickVacancies(list)).toHaveLength(15)
    expect(pickVacancies([])).toEqual([])
  })
})
