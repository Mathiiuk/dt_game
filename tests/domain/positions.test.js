import {
  POSITIONS, POSITION_CODES, normalizePosition, slotBase, positionLine, positionDistance, positionPenalty, fitLabel, positionName, isGoalkeeper
} from '../../src/domain/positions'

describe('posiciones del juego', () => {
  it('son las 12 del fútbol en castellano y cada una tiene nombre y línea', () => {
    expect(POSITION_CODES).toEqual(['PO', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'MI', 'MD', 'EI', 'ED', 'DC'])
    for (const p of POSITIONS) { expect(p.name).toBeTruthy(); expect(['ARQ', 'DEF', 'MED', 'DEL']).toContain(p.line) }
  })

  it('traduce los códigos viejos en inglés y los de puesto con número', () => {
    expect(normalizePosition('GK')).toBe('PO')
    expect(normalizePosition('CB')).toBe('DFC')
    expect(normalizePosition('LCB')).toBe('DFC')
    expect(normalizePosition('LB')).toBe('LI')
    expect(normalizePosition('RWB')).toBe('LD')
    expect(normalizePosition('CDM')).toBe('MCD')
    expect(normalizePosition('CM')).toBe('MC')
    expect(normalizePosition('CAM')).toBe('MCO')
    expect(normalizePosition('LM')).toBe('MI')
    expect(normalizePosition('RW')).toBe('ED')
    expect(normalizePosition('ST')).toBe('DC')
    expect(normalizePosition('DFC2')).toBe('DFC')
    expect(normalizePosition('MC1')).toBe('MC')
    expect(normalizePosition('DC')).toBe('DC')
    expect(normalizePosition('XYZ')).toBe('MC')
    expect(normalizePosition(undefined)).toBe('MC')
  })

  it('slotBase quita el número del puesto', () => {
    expect(slotBase('DFC2')).toBe('DFC')
    expect(slotBase('mc1')).toBe('MC')
    expect(slotBase('PO')).toBe('PO')
  })

  it('líneas y nombres', () => {
    expect(positionLine('LI')).toBe('DEF')
    expect(positionLine('MCO')).toBe('MED')
    expect(positionLine('ED')).toBe('DEL')
    expect(positionName('DC')).toBe('Delantero centro')
    expect(isGoalkeeper('GK')).toBe(true)
    expect(isGoalkeeper('DC')).toBe(false)
  })

  it('la distancia entre puestos crece con la lejanía y el arco es caso aparte', () => {
    expect(positionDistance('DC', 'DC')).toBe(0)
    expect(positionDistance('EI', 'DC')).toBe(1)
    expect(positionDistance('LI', 'MI')).toBe(1)
    expect(positionDistance('MC', 'MI')).toBe(1)
    expect(positionDistance('DFC', 'LI')).toBe(1)
    expect(positionDistance('MC', 'MD')).toBe(1)
    expect(positionDistance('DFC', 'MC')).toBeGreaterThan(1)
    expect(positionDistance('DFC', 'DC')).toBeGreaterThan(positionDistance('DFC', 'MC'))
    expect(positionDistance('PO', 'DC')).toBe(9)
    expect(positionDistance('DC', 'PO')).toBe(9)
  })

  it('un arquero de delantero pierde muchísimo más que un lateral de volante', () => {
    expect(positionPenalty('PO', 'DC')).toBeGreaterThanOrEqual(40)
    expect(positionPenalty('LI', 'MI')).toBeLessThan(5)
    expect(positionPenalty('DC', 'DC')).toBe(0)
    expect(positionPenalty('DFC', 'DC')).toBeGreaterThan(positionPenalty('DFC', 'MC'))
  })

  it('la etiqueta de ajuste distingue natural, compatible, adaptado y fuera de puesto', () => {
    expect(fitLabel('DC', 'DC1').code).toBe('NATURAL')
    expect(fitLabel('LI', 'MI').code).toBe('COMPATIBLE')
    expect(fitLabel('MI', 'MD').code).toBe('ADAPTED')
    expect(fitLabel('MC', 'DC').code).toBe('OUT_OF_POSITION')
    expect(fitLabel('PO', 'DC').code).toBe('OUT_OF_POSITION')
    expect(fitLabel('DFC', 'DC').code).toBe('OUT_OF_POSITION')
  })
})
