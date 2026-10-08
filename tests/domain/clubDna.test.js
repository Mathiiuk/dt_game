import { describe, it, expect } from 'vitest'
import {
  calculateClubDNA,
  getClubAtmosphere,
  getLockerRoomDynamics,
  evaluateCaptainChange
} from '../../src/domain/clubDna'

describe('dominio vivo del club (ADN, Tribuna y Vestuario)', () => {
  it('calcula el ADN del club según historia, división y cantera', () => {
    const club = {
      name: 'Club Atlético Potrero',
      founded_year: 1930,
      league_tier: 5,
      academy_level: 3,
      city: 'Rosario'
    }
    const history = [{ season_year: 2025, champions: true }]

    const dna = calculateClubDNA(club, history)
    expect(dna.primaryTrait).toBeDefined()
    expect(dna.attributes.cantera).toBeGreaterThanOrEqual(50)
    expect(dna.attributes.identidadLocal).toBeGreaterThanOrEqual(60)
    expect(dna.attributes.tradicion).toBeGreaterThan(0)
    expect(dna.summary).toBeDefined()
  })

  it('devuelve el clima de la tribuna en lenguaje humano y no solo números', () => {
    const fanbase = {
      popularity: 75,
      satisfaction: 82,
      members_count: 8400,
      stadium_capacity: 10000,
      last_attendance: 8300
    }

    const atmosphere = getClubAtmosphere(fanbase)
    expect(atmosphere.headline).toContain('La gente')
    expect(atmosphere.popularity).toBe(75)
    expect(atmosphere.attendanceRate).toBe('83%')
    expect(atmosphere.latestEvent).toBeDefined()
  })

  it('evalúa la dinámica humana del vestuario sin reducirla a una barra porcentual', () => {
    const squad = [
      { id: '1', first_name: 'Juan', last_name: 'Pérez', age: 33, position: 'DFC', attr_overall: 68, state_morale: 85 },
      { id: '2', first_name: 'Tomás', last_name: 'Luna', age: 18, position: 'DC', attr_overall: 58, state_morale: 80 }
    ]

    const dynamics = getLockerRoomDynamics(squad)
    expect(dynamics.headline).toBeDefined()
    expect(dynamics.cohesionStatus).toBeDefined()
    expect(dynamics.leaders.length).toBeGreaterThan(0)
    expect(dynamics.prospects.length).toBeGreaterThan(0)
  })

  it('evalúa el cambio de capitán con lectura de consecuencias en lenguaje natural', () => {
    const oldCap = { last_name: 'Pérez', age: 33, attr_overall: 70 }
    const newCap = { last_name: 'Luna', age: 19, attr_overall: 60 }

    const evalChange = evaluateCaptainChange(oldCap, newCap)
    expect(evalChange.riskNotice).toContain('Pérez')
    expect(evalChange.summary).toBeDefined()
  })
})
