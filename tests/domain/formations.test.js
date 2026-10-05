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
      const gk = layout.find(p => p.slot === 'GK')
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
    expect(slotCoords('4-3-3').ST).toEqual({ x: 50, y: 17 })
  })
})

describe('reasignación de titulares al cambiar de formación', () => {
  const squad = [
    P('gk', 'GK'), P('lb', 'LB'), P('lcb', 'LCB'), P('rcb', 'RCB'), P('rb', 'RB'),
    P('lm', 'LM'), P('lcm', 'LCM'), P('rcm', 'RCM'), P('rm', 'RM'), P('lst', 'LST'), P('rst', 'RST'),
    P('st', 'ST', { attr_overall: 70 }), P('cdm', 'CDM'), P('lw', 'LW'), P('rw', 'RW'), P('hurt', 'ST', { is_injured: true, attr_overall: 90 })
  ]
  const starters442 = ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lm', 'lcm', 'rcm', 'rm', 'lst', 'rst']

  it('de 4-4-2 a 4-3-3 conserva a los titulares en su puesto natural y completa los huecos', () => {
    const next = reassignLineup(FORMATIONS['4-3-3'].slots, squad, starters442)
    expect(Object.keys(next)).toHaveLength(11)
    expect(new Set(Object.values(next)).size).toBe(11)
    expect(next.GK).toBe('gk')
    expect(next.LB).toBe('lb')
    expect(next.LCB).toBe('lcb')
    expect(next.LW).toBe('lm')               // el volante izquierdo pasa a extremo (compatible)
    expect(next.ST).toBe('lst')              // continuidad: el delantero titular (compatible) conserva su lugar
    expect(Object.values(next)).not.toContain('hurt')
  })

  it('si faltan titulares completa los huecos con el mejor candidato del banco (el 9 natural, no un lesionado)', () => {
    const partial = ['gk', 'lb', 'lcb', 'rcb', 'rb', 'lcm', 'rcm', 'rm']
    const next = reassignLineup(FORMATIONS['4-3-3'].slots, squad, partial)
    expect(Object.keys(next)).toHaveLength(11)
    expect(next.ST).toBe('st')
    expect(Object.values(next)).not.toContain('hurt')
  })

  it('nunca asigna a un lesionado si hay alternativa sana', () => {
    const next = reassignLineup(FORMATIONS['3-4-3'].slots, squad, starters442)
    expect(Object.values(next)).not.toContain('hurt')
  })

  it('sin titulares previos arma un once completo y con afinidad natural donde existe', () => {
    const next = reassignLineup(FORMATIONS['4-4-2'].slots, squad, [])
    expect(Object.keys(next)).toHaveLength(11)
    expect(next.GK).toBe('gk')
    expect(new Set(Object.values(next)).size).toBe(11)
  })

  it('con plantel corto usa lesionados como último recurso y sigue completando 11', () => {
    const short = [P('gk', 'GK'), P('a', 'CB'), P('b', 'CB', { is_injured: true }), P('c', 'ST')]
    const next = reassignLineup(FORMATIONS['4-4-2'].slots, short, [])
    expect(Object.keys(next)).toHaveLength(4) // sólo hay 4 jugadores: no se inventan
  })
})
