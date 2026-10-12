import { buildRoad } from '../../src/domain/legendRoad'

const legends = [
  { name: 'Ramón Díaz', era: 'A', titles: 17, points: 10200 },
  { name: 'Guillermo Stábile', era: 'B', titles: 13, points: 7800 },
  { name: 'Carlos Bianchi', era: 'C', titles: 15, points: 9000 }
]
const me = (points, extra = {}) => ({ points, titles: 0, played: 12, won: 5, ...extra })

describe('camino a la leyenda', () => {
  it('ordena a las leyendas de la más alta a la más baja', () => {
    const road = buildRoad({ me: me(100), legends })
    expect(road.rows.map(r => r.name)).toEqual(['Ramón Díaz', 'Carlos Bianchi', 'Guillermo Stábile'])
  })

  it('el próximo objetivo es la leyenda más cercana por encima, con lo que falta y el avance', () => {
    const road = buildRoad({ me: me(5000), legends })
    expect(road.next.name).toBe('Guillermo Stábile')
    expect(road.next.remaining).toBe(2800)
    expect(road.next.progress).toBeCloseTo(5000 / 7800, 3)
    expect(road.passed).toBe(0)
  })

  it('marca a las leyendas superadas (con puntos iguales también) y cuenta cuántas', () => {
    const road = buildRoad({ me: me(9000), legends })
    expect(road.rows.filter(r => r.beaten).map(r => r.name)).toEqual(['Carlos Bianchi', 'Guillermo Stábile'])
    expect(road.passed).toBe(2)
    expect(road.next.name).toBe('Ramón Díaz')
    expect(road.next.remaining).toBe(1200)
  })

  it('quien superó a todas ya no tiene objetivo y queda por encima de todas', () => {
    const road = buildRoad({ me: me(20000), legends })
    expect(road.next).toBeNull()
    expect(road.passed).toBe(3)
    expect(road.allBeaten).toBe(true)
  })

  it('cada fila trae el avance de 0 a 1 sin pasarse', () => {
    const road = buildRoad({ me: me(5000), legends })
    for (const r of road.rows) expect(r.progress).toBeGreaterThanOrEqual(0)
    for (const r of road.rows) expect(r.progress).toBeLessThanOrEqual(1)
  })

  it('sin DT o sin leyendas no hay camino', () => {
    expect(buildRoad({ me: null, legends })).toBeNull()
    expect(buildRoad({ me: me(5), legends: [] })).toBeNull()
    expect(buildRoad({})).toBeNull()
  })

  it('ignora leyendas con datos inválidos', () => {
    const road = buildRoad({ me: me(0), legends: [...legends, { name: '', points: 5 }, { name: 'X', points: 'nada' }, null] })
    expect(road.rows).toHaveLength(3)
  })

  it('puntos negativos o raros cuentan como cero', () => {
    expect(buildRoad({ me: me(-50), legends }).next.remaining).toBe(7800)
    expect(buildRoad({ me: me('x'), legends }).next.remaining).toBe(7800)
  })
})
