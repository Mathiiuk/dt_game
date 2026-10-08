import { describe, it, expect } from 'vitest'
import {
  pickRivalClubs,
  RIVAL_POOL,
  HISTORICAL_CLUBS_BY_TIER,
  ALL_HISTORICAL_CLUBS,
  getClubsForTier
} from '../../src/domain/rivalClubs'

describe('rivales de cada liga y catálogo histórico', () => {
  it('hay un pozo grande con más de 120 clubes sin nombres ni siglas repetidas', () => {
    expect(RIVAL_POOL.length).toBeGreaterThanOrEqual(120)
    expect(new Set(RIVAL_POOL.map(c => c.name.toLowerCase())).size).toBe(RIVAL_POOL.length)
    expect(new Set(RIVAL_POOL.map(c => c.short_name.toUpperCase())).size).toBe(RIVAL_POOL.length)
  })

  it('cada una de las 5 categorías tiene al menos 25 clubes reales', () => {
    for (let tier = 1; tier <= 5; tier++) {
      const clubs = getClubsForTier(tier)
      expect(clubs.length).toBeGreaterThanOrEqual(25)
      expect(HISTORICAL_CLUBS_BY_TIER[tier]).toBeDefined()
    }
  })

  it('todos los clubes tienen atributos completos de identidad, colores y estadios reales', () => {
    ALL_HISTORICAL_CLUBS.forEach(club => {
      expect(club.name).toBeTruthy()
      expect(club.short_name).toMatch(/^[A-Z0-9Ñ]{2,5}$/)
      expect(club.city).toBeTruthy()
      expect(club.primary_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(club.secondary_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(club.stadium_name).toBeTruthy()
      expect(club.stadium_capacity).toBeGreaterThanOrEqual(1000)
      expect(club.founded_year).toBeGreaterThanOrEqual(1870)
      expect(club.tier).toBeGreaterThanOrEqual(1)
      expect(club.tier).toBeLessThanOrEqual(5)
    })
  })

  it('la misma carrera siempre tiene los mismos 19 rivales, sin repetidos', () => {
    const a = pickRivalClubs('club-1')
    expect(a).toHaveLength(19)
    expect(new Set(a.map(c => c.name)).size).toBe(19)
    expect(pickRivalClubs('club-1')).toEqual(a)
  })

  it('carreras distintas tienen rivales distintos', () => {
    const names = (seed) => pickRivalClubs(seed).map(c => c.name).join('|')
    const sets = new Set(['a', 'b', 'c', 'd', 'e', 'f'].map(names))
    expect(sets.size).toBeGreaterThan(4)
  })

  it('se puede excluir un nombre (el del club del jugador)', () => {
    const picked = pickRivalClubs('club-1', 19, ['deportivo central', 'Atlético Belgrano'])
    expect(picked.some(c => c.name === 'Deportivo Central' || c.name === 'Atlético Belgrano')).toBe(false)
    expect(picked).toHaveLength(19)
  })

  it('respeta la cantidad pedida', () => {
    expect(pickRivalClubs('x', 5)).toHaveLength(5)
  })

  it('al solicitar rivales para la categoría 5 (Potrero), devuelve clubes de esa categoría', () => {
    const potreroRivals = pickRivalClubs('carrera-potrero', 19, { tier: 5 })
    expect(potreroRivals).toHaveLength(19)
    expect(potreroRivals.every(c => c.tier === 5)).toBe(true)
    // Verifica presencia de nombres emblemáticos del regional/potrero
    const names = potreroRivals.map(c => c.name)
    expect(new Set(names).size).toBe(19)
  })

  it('al solicitar rivales para Primera División (tier 1), devuelve clubes de primera', () => {
    const primeraRivals = pickRivalClubs('carrera-primera', 19, { tier: 1 })
    expect(primeraRivals).toHaveLength(19)
    expect(primeraRivals.every(c => c.tier === 1)).toBe(true)
  })

  it('al excluir el club del jugador dentro de una categoría, no lo incluye', () => {
    const rivals = pickRivalClubs('carrera-river', 19, { tier: 1, exclude: ['River Plate'] })
    expect(rivals).toHaveLength(19)
    expect(rivals.some(c => c.name === 'River Plate')).toBe(false)
  })

  it('admite la firma opcional con tier como cuarto parámetro', () => {
    const rivals = pickRivalClubs('carrera-4', 10, ['Ferrocarril Midland'], 4)
    expect(rivals).toHaveLength(10)
    expect(rivals.every(c => c.tier === 4)).toBe(true)
    expect(rivals.some(c => c.name === 'Ferrocarril Midland')).toBe(false)
  })
})
