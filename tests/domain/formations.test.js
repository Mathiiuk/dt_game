vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { FORMATIONS } from '../../src/api/tactics'
import { FORMATION_LAYOUTS, getLayout, slotCoords, reassignLineup } from '../../src/domain/formations'

const P = (id, position, extra = {}) => ({ id, position, attr_overall: 60, ...extra })

describe('layouts de formaciones', () => {
  it('cada formación tiene exactamente los 11 puestos declarados en FORMATIONS, sin repetir', () => {
    for (const [key, cfg] of Object.entries(FORMATIONS)) {
      const layout = FORMATION_LAYOUTS[key]
      expect(layout, `falta layout de ${key}`).toBeDefined()
      expect(layout.map(p => p.slot).sort()).toEqual([...cfg.slots].sort())
    }
  })

  it('todas las coordenadas caen dentro de la cancha y el arquero está más atrás que todos', () => {
    for (const layout of Object.values(FORMATION_LAYOUTS)) {
      for (const { x, y } of layout) {
        expect(x).toBeGreaterThanOrEqual(5); expect(x).toBeLessThanOrEqual(95)
        expect(y).toBeGreaterThanOrEqual(8); expect(y).toBeLessThanOrEqual(95)
      }
      const gk = layout.find(p => p.slot === 'PO')
      expect(layout.every(p => p === gk || p.y < gk.y)).toBe(true)
    }
  })

  it('ningún par de jugadores se superpone (distancia mínima entre fichas)', () => {
    for (const [key, layout] of Object.entries(FORMATION_LAYOUTS)) {
      for (let i = 0; i < layout.length; i++) for (let j = i + 1; j < layout.length; j++) {
        const d = Math.hypot(layout[i].x - layout[j].x, (layout[i].y - layout[j].y) * 0.75)
        expect(d, `${key}: ${layout[i].slot}-${layout[j].slot}`).toBeGreaterThan(10)
      }
    }
  })

  it('getLayout cae en 4-4-2 y slotCoords devuelve un mapa por puesto', () => {
    expect(getLayout('inexistente')).toBe(FORMATION_LAYOUTS['4-4-2'])
    expect(slotCoords('4-3-3').DC).toEqual({ x: 50, y: 17 })
  })
})

describe('reasignación de titulares al cambiar de formación', () => {
  const squad = [
    P('gk', 'PO'), P('lb', 'LI'), P('lcb', 'DFC'), P('rcb', 'DFC'), P('rb', 'LD'),
    P('lm', 'MI'), P('lcm', 'MC'), P('rcm', 'MC'), P('rm', 'MD'), P('lst', 'DC'), P('rst', 'DC'),
    P('st', 'DC', { attr_overall: 70 }), P('cdm', 'MCD'), P('lw', 'EI'), P('rw', 'ED'), P('hurt', 'DC', { is_injured: true, attr_overall: 90 })
  ]
  const starters442 = ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lm', 'lcm', 'rcm', 'rm', 'lst', 'rst']

  it('de 4-4-2 a 4-3-3 conserva a los titulares en su puesto natural y completa los huecos', () => {
    const next = reassignLineup(FORMATIONS['4-3-3'].slots, squad, starters442)
    expect(Object.keys(next)).toHaveLength(11)
    expect(new Set(Object.values(next)).size).toBe(11)
    expect(next.PO).toBe('gk')
    expect(next.LI).toBe('lb')
    expect(['lcb', 'rcb']).toContain(next.DFC1)
    expect(next.EI).toBe('lm')               // el volante izquierdo pasa a extremo (compatible)
    expect(['lst', 'rst']).toContain(next.DC) // continuidad: un delantero titular conserva su lugar
    expect(Object.values(next)).not.toContain('hurt')
  })

  it('si faltan titulares completa los huecos con el mejor candidato del banco (el 9 natural, no un lesionado)', () => {
    const partial = ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lcm', 'rcm', 'rm']
    const next = reassignLineup(FORMATIONS['4-3-3'].slots, squad, partial)
    expect(Object.keys(next)).toHaveLength(11)
    expect(next.DC).toBe('st')
    expect(Object.values(next)).not.toContain('hurt')
  })

  it('nunca asigna a un lesionado si hay alternativa sana', () => {
    const next = reassignLineup(FORMATIONS['3-4-3'].slots, squad, starters442)
    expect(Object.values(next)).not.toContain('hurt')
  })

  it('sin titulares previos arma un once completo y con afinidad natural donde existe', () => {
    const next = reassignLineup(FORMATIONS['4-4-2'].slots, squad, [])
    expect(Object.keys(next)).toHaveLength(11)
    expect(next.PO).toBe('gk')
    expect(new Set(Object.values(next)).size).toBe(11)
  })

  it('con plantel corto usa lesionados como último recurso y sigue completando 11', () => {
    const short = [P('gk', 'PO'), P('a', 'DFC'), P('b', 'DFC', { is_injured: true }), P('c', 'DC')]
    const next = reassignLineup(FORMATIONS['4-4-2'].slots, short, [])
    expect(Object.keys(next)).toHaveLength(4) // sólo hay 4 jugadores: no se inventan
  })
})

import { resolveLineup } from '../../src/domain/formations'
import { ratingAtSlot } from '../../src/domain/ratings'

describe('alineación guardada desordenada', () => {
  const xi = [
    P('gk', 'PO', { attr_overall: 62 }), P('li', 'LI'), P('d1', 'DFC'), P('d2', 'DFC'), P('ld', 'LD'),
    P('mi', 'MI'), P('m1', 'MC'), P('m2', 'MC'), P('md', 'MD'), P('c1', 'DC'), P('c2', 'DC')
  ]
  const slots442 = FORMATIONS['4-4-2'].slots
  const orderedIds = ['gk', 'li', 'd1', 'd2', 'ld', 'mi', 'm1', 'm2', 'md', 'c1', 'c2']

  it('una alineación ordenada se respeta tal cual', () => {
    const map = resolveLineup(slots442, xi, orderedIds)
    expect(map.PO).toBe('gk')
    expect(map.DC2).toBe('c2')
    expect(Object.values(map)).toEqual(orderedIds)
  })

  it('una alineación guardada "los mejores 11" sin respetar puestos (delantero en el arco) se reubica sola', () => {
    const scrambled = ['c1', 'm1', 'd1', 'd2', 'c2', 'li', 'gk', 'ld', 'mi', 'm2', 'md'] // el delantero en el puesto del arquero
    const map = resolveLineup(slots442, xi, scrambled)
    expect(map.PO).toBe('gk')
    expect(new Set(Object.values(map)).size).toBe(11)
    const avg = Object.entries(map).reduce((s, [slot, id]) => s + ratingAtSlot(xi.find(p => p.id === id), slot), 0) / 11
    expect(avg).toBeGreaterThan(58)
  })

  it('un cambio chico a propósito (un lateral de volante) no se toca', () => {
    const ids = [...orderedIds]
    ids[5] = 'li'; ids[1] = 'mi' // intercambio compatible
    const map = resolveLineup(slots442, xi, ids)
    expect(map.MI).toBe('li')
  })

  it('con ids que ya no están en el plantel completa los huecos', () => {
    const map = resolveLineup(slots442, xi, ['fantasma', ...orderedIds.slice(1)])
    expect(Object.keys(map)).toHaveLength(11)
    expect(map.PO).toBe('gk')
  })
})
