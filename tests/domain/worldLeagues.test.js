import { describe, it, expect } from 'vitest'
import { worldTiers, worldClubRow, leagueBoards, withUserLeaders, isCurrentSeasonLeague } from '../../src/domain/worldLeagues'
import { tierStrengthRange } from '../../src/domain/pyramid'

describe('ligas del mundo', () => {
  it('son las cinco divisiones menos la del club del usuario', () => {
    expect(worldTiers(5)).toEqual([1, 2, 3, 4])
    expect(worldTiers(1)).toEqual([2, 3, 4, 5])
    expect(worldTiers(3)).toEqual([1, 2, 4, 5])
    expect(worldTiers(undefined)).toEqual([1, 2, 3, 4])
  })

  it('un club rival lleva la fuerza de su categoría', () => {
    for (const tier of [1, 3, 5]) {
      const [lo, hi] = tierStrengthRange(tier)
      for (const r of [0, 0.5, 0.999]) {
        const row = worldClubRow({ name: 'Club X', short_name: 'CLX' }, 0, tier, () => r, 'Argentina')
        expect(row.strength).toBeGreaterThanOrEqual(lo)
        expect(row.strength).toBeLessThanOrEqual(hi)
        expect(row).toMatchObject({ name: 'Club X', league_tier: tier, history_type: 'bot', country: 'Argentina' })
      }
    }
  })

  it('una liga es de esta temporada si su año coincide; sin año (la del club, de antes) cuenta como la actual', () => {
    expect(isCurrentSeasonLeague({ season_year: 2026 }, 2026)).toBe(true)
    expect(isCurrentSeasonLeague({ season_year: 2025 }, 2026)).toBe(false)
    expect(isCurrentSeasonLeague({ season_year: null }, 2026)).toBe(true)
  })
})

describe('tablas de goleadores de una liga', () => {
  const rows = [
    { player_name: 'Lucas Gómez', club_id: 'a', club_name: 'Alfa', goals: 7, assists: 2 },
    { player_name: 'Mateo Sosa', club_id: 'b', club_name: 'Beta', goals: 7, assists: 5 },
    { player_name: 'Bruno Díaz', club_id: 'a', club_name: 'Alfa', goals: 1, assists: 9 },
    { player_name: 'Nadie Nunca', club_id: 'c', club_name: 'Gama', goals: 0, assists: 0 }
  ]

  it('goleadores: por goles y, a igualdad, por asistencias; sin los que no marcaron', () => {
    const { scorers } = leagueBoards(rows)
    expect(scorers.map(s => s.name)).toEqual(['Mateo Sosa', 'Lucas Gómez', 'Bruno Díaz'])
    expect(scorers[0]).toMatchObject({ goals: 7, clubName: 'Beta' })
  })

  it('asistentes: por asistencias', () => {
    expect(leagueBoards(rows).assisters.map(s => [s.name, s.assists])).toEqual([['Bruno Díaz', 9], ['Mateo Sosa', 5], ['Lucas Gómez', 2]])
  })

  it('la figura suma goles y asistencias', () => {
    const { best } = leagueBoards(rows)
    expect(best.map(b => [b.name, b.points])).toEqual([['Mateo Sosa', 12], ['Bruno Díaz', 10], ['Lucas Gómez', 9]])
  })

  it('respeta el límite y no se rompe sin datos', () => {
    expect(leagueBoards(rows, { limit: 2 }).scorers).toHaveLength(2)
    expect(leagueBoards([])).toEqual({ scorers: [], assisters: [], best: [] })
    expect(leagueBoards(undefined)).toEqual({ scorers: [], assisters: [], best: [] })
  })
})

describe('los jugadores de tu club en tu liga', () => {
  const boards = leagueBoards([{ player_name: 'Lucas Gómez', club_id: 'a', club_name: 'Alfa', goals: 4, assists: 1 }])
  const mine = {
    scorers: [{ player_id: 'p1', name: 'Mi Goleador', goals: 6, assists: 0, matches: 5 }],
    assisters: [{ player_id: 'p2', name: 'Mi Asistidor', goals: 0, assists: 3, matches: 5 }],
    best: []
  }

  it('se mezclan con los de la IA y quedan ordenados, marcados con el nombre de tu club', () => {
    const merged = withUserLeaders(boards, mine, 'Mi Club')
    expect(merged.scorers.map(s => [s.name, s.goals])).toEqual([['Mi Goleador', 6], ['Lucas Gómez', 4]])
    expect(merged.scorers[0]).toMatchObject({ clubName: 'Mi Club', mine: true })
    expect(merged.assisters[0]).toMatchObject({ name: 'Mi Asistidor', assists: 3, mine: true })
    expect(merged.best.map(b => b.name)).toContain('Mi Goleador')
  })

  it('no suma dos veces al mismo jugador de tu club', () => {
    const both = { scorers: mine.scorers, assisters: [{ player_id: 'p1', name: 'Mi Goleador', goals: 6, assists: 2, matches: 5 }], best: [] }
    const merged = withUserLeaders(boards, both, 'Mi Club')
    expect(merged.best.filter(b => b.name === 'Mi Goleador')).toHaveLength(1)
    expect(merged.best.find(b => b.name === 'Mi Goleador').points).toBe(8)
  })

  it('sin datos de tu club deja la liga como está', () => {
    expect(withUserLeaders(boards, null, 'Mi Club')).toEqual(boards)
  })
})
