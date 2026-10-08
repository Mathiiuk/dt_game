// Pruebas unitarias para el dominio del Radar Nacional y Termómetro de Selección
import { describe, it, expect } from 'vitest'
import {
  evaluateNationalRadar,
  calculateNationalGauge,
  getCountryIdentity,
  generateNationalHeadlines
} from '../../src/domain/nationalRadar'

describe('Dominio de Selección Nacional: Radar y Termómetro', () => {
  it('obtiene la identidad del país parametrizado con apodo y colores', () => {
    const ar = getCountryIdentity('AR')
    expect(ar.name).toBe('Argentina')
    expect(ar.nickname).toBe('Albiceleste')
    expect(ar.colors.primary).toBe('#75AADB')

    const br = getCountryIdentity('BR')
    expect(br.name).toBe('Brasil')
    expect(br.nickname).toBe('Canarinha')

    // Por defecto devuelve Argentina
    const def = getCountryIdentity(null)
    expect(def.nickname).toBe('Albiceleste')
  })

  it('calcula el termómetro de selección con niveles narrativos claros', () => {
    const low = calculateNationalGauge({ reputation: 10 })
    expect(low.percentage).toBeLessThanOrEqual(25)
    expect(low.tierName).toBe('DT en Formación')
    expect(low.nextMilestone).toContain('Sub-20')

    const mid = calculateNationalGauge({ reputation: 45 })
    expect(mid.tierName).toBe('Mencionado en la Prensa')

    const high = calculateNationalGauge({ reputation: 80 })
    expect(high.tierName).toBe('Candidato Selección Mayor')
    expect(high.percentage).toBeGreaterThanOrEqual(75)
  })

  it('evalúa el radar de convocatorias distinguiendo Sub-17, Sub-20, Sub-23 y Mayor con costos/beneficios', () => {
    const squad = [
      { id: 'p1', first_name: 'Thiago', last_name: 'Pibe', age: 17, attr_overall: 52, position: 'MC' },
      { id: 'p2', first_name: 'Mateo', last_name: 'Promesa', age: 19, attr_overall: 58, position: 'DC' },
      { id: 'p3', first_name: 'Lucas', last_name: 'Consagrado', age: 26, attr_overall: 70, position: 'DFC' },
      { id: 'p4', first_name: 'Carlos', last_name: 'Normal', age: 25, attr_overall: 50, position: 'LI' }
    ]

    const radar = evaluateNationalRadar(squad, 30, 'AR')
    expect(radar.players.length).toBeGreaterThanOrEqual(3)

    const sub17 = radar.players.find(p => p.player.id === 'p1')
    expect(sub17.category).toBe('Sub-17')
    expect(sub17.benefits).toBeDefined()
    expect(sub17.costs).toBeDefined()
    expect(sub17.benefits.valueBoost).toBe(25) // +25% de valor de mercado
    expect(sub17.costs.fatigue).toBe(20) // -20% de físico/ritmo

    const mayor = radar.players.find(p => p.player.id === 'p3')
    expect(mayor.category).toBe('Mayor')
    expect(mayor.status).toBe('called_up') // Al tener 70 de media está convocado
  })

  it('genera titulares deportivos vivos basados en los jugadores del radar', () => {
    const candidates = [
      { player: { first_name: 'Thiago', last_name: 'Pibe' }, category: 'Sub-20', status: 'called_up' }
    ]
    const headlines = generateNationalHeadlines(candidates, { name: 'Scaloni DT' }, 'Albiceleste')
    expect(headlines.length).toBeGreaterThan(0)
    expect(headlines[0]).toContain('Pibe')
  })
})
