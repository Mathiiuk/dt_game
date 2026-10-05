import {
  POSITION_WEIGHTS, ATTRIBUTE_KEYS, calculateOverall, ratingAtSlot, lineupRating, generateAttributesForOverall, playerOverall, RATING_MAX
} from '../../src/domain/ratings'
import { POSITION_CODES } from '../../src/domain/positions'
import { seededRandom } from '../../src/domain/cupMatch'

const flat = (value, extra = {}) => ({ ...Object.fromEntries(ATTRIBUTE_KEYS.map(k => [`attr_${k}`, value])), ...extra })

describe('pesos por posición', () => {
  it('hay pesos para las 12 posiciones, cada fila suma 1 y usa sólo atributos conocidos', () => {
    expect(Object.keys(POSITION_WEIGHTS).sort()).toEqual([...POSITION_CODES].sort())
    for (const [pos, weights] of Object.entries(POSITION_WEIGHTS)) {
      const sum = Object.values(weights).reduce((s, w) => s + w, 0)
      expect(sum, pos).toBeCloseTo(1, 5)
      for (const key of Object.keys(weights)) expect(ATTRIBUTE_KEYS, `${pos}.${key}`).toContain(key)
    }
  })
})

describe('media por posición', () => {
  it('un jugador con todos los atributos iguales tiene esa media en cualquier posición', () => {
    for (const pos of POSITION_CODES) expect(calculateOverall(flat(70), pos)).toBe(70)
  })

  it('un goleador rinde más de delantero que de defensor central', () => {
    const striker = flat(50, { position: 'DC', attr_finishing: 90, attr_shooting: 85, attr_heading: 75, attr_marking: 30, attr_tackling: 30 })
    expect(calculateOverall(striker, 'DC')).toBeGreaterThan(calculateOverall(striker, 'DFC') + 15)
  })

  it('usa la posición del jugador por defecto y acepta códigos viejos', () => {
    const gk = flat(50, { position: 'GK', attr_positioning: 90, attr_concentration: 85 })
    expect(calculateOverall(gk)).toBe(calculateOverall(gk, 'PO'))
    expect(calculateOverall(gk, 'GK')).toBe(calculateOverall(gk, 'PO'))
  })

  it('playerOverall prefiere la media guardada y calcula si falta', () => {
    expect(playerOverall({ attr_overall: 66 })).toBe(66)
    expect(playerOverall(flat(61, { position: 'MC' }))).toBe(61)
    expect(playerOverall(null)).toBe(50)
  })
})

describe('media en un puesto de la cancha (B7: el nivel del once depende de dónde juega cada uno)', () => {
  const gk = flat(40, { position: 'PO', attr_overall: 64, attr_positioning: 85, attr_concentration: 80, attr_decisions: 70, attr_mentality: 70, attr_finishing: 20, attr_shooting: 20 })
  const dc = flat(60, { position: 'DC', attr_overall: 65, attr_finishing: 80 })

  it('en su puesto natural vale su media; en otro, se castiga', () => {
    expect(ratingAtSlot(dc, 'DC1')).toBe(65)
    expect(ratingAtSlot(dc, 'EI')).toBeLessThan(65)
    expect(ratingAtSlot(dc, 'EI')).toBeGreaterThan(ratingAtSlot(dc, 'DFC'))
  })

  it('un arquero de delantero rinde una fracción de lo que rinde en el arco', () => {
    expect(ratingAtSlot(gk, 'PO')).toBe(64)
    expect(ratingAtSlot(gk, 'DC')).toBeLessThan(25)
  })

  it('el nivel del once cae al poner a un arquero de delantero', () => {
    const base = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`MC${i}`, flat(62, { position: 'MC', attr_overall: 62 })]))
    const good = lineupRating({ ...base, PO: gk, DC: dc })
    const bad = lineupRating({ ...base, PO: dc, DC: gk })
    expect(good).toBeGreaterThan(bad + 8)
  })

  it('un once vacío vale 0', () => expect(lineupRating({})).toBe(0))
})

describe('generación de atributos con la media pedida', () => {
  it.each(POSITION_CODES)('para %s la media cae a ±2 del objetivo en toda la escala', (pos) => {
    const rand = seededRandom(`gen-${pos}`)
    for (const target of [50, 55, 60, 68, 80, 95]) {
      const attrs = generateAttributesForOverall(target, pos, rand)
      const overall = calculateOverall(attrs, pos)
      expect(Math.abs(overall - target), `${pos} objetivo ${target} dio ${overall}`).toBeLessThanOrEqual(2)
      for (const v of Object.values(attrs)) { expect(v).toBeGreaterThanOrEqual(25); expect(v).toBeLessThanOrEqual(RATING_MAX) }
    }
  })

  it('los atributos clave de la posición salen más altos que los irrelevantes', () => {
    const rand = seededRandom('claves')
    const attrs = generateAttributesForOverall(60, 'DC', rand)
    expect(attrs.attr_finishing).toBeGreaterThan(attrs.attr_marking + 10)
    const gk = generateAttributesForOverall(60, 'PO', rand)
    expect(gk.attr_positioning).toBeGreaterThan(gk.attr_finishing + 10)
  })
})
