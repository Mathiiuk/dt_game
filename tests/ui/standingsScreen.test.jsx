import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { zoneLegend, zoneOf, goalDiff, formatDiff, parseForm } from '../../src/domain/standings'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const rows = Array.from({ length: 10 }, (_, i) => ({
  id: `s${i}`, club_id: i === 3 ? 'c1' : `x${i}`, clubs: { name: i === 3 ? 'Club Atlético Potrero' : `Rival ${i}` },
  played: 5, won: 3, drawn: 1, lost: 1, goals_for: 10 - i, goals_against: 4, points: 30 - i, form: 'V,E,D'
}))
const getStandings = vi.fn(async () => rows)
vi.mock('../../src/api/competition', () => ({ competitionApi: { getStandings: (...a) => getStandings(...a) } }))
const club = { id: 'c1', league_tier: 5 }
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ club, loading: false, confirmAction: vi.fn(async () => false) }) }))
vi.mock('../../src/features/competition/LeaguePyramidModal', () => ({ default: () => <div role="dialog" aria-label="Pirámide" /> }))
vi.mock('../../src/features/competition/LeagueDataModal', () => ({ default: () => <div role="dialog" aria-label="Todas las ligas" /> }))

import StandingsScreen from '../../src/features/competition/StandingsScreen'

describe('dominio de la tabla', () => {
  it('asigna zonas según posición, tamaño de la tabla y división', () => {
    expect(zoneOf(1, 20, 4).id).toBe('PROMOTION')
    expect(zoneOf(5, 20, 4).id).toBe('NONE')
    expect(zoneOf(18, 20, 4).id).toBe('RELEGATION')
    expect(zoneOf(8, 10, 4).id).toBe('RELEGATION')
  })
  it('la última división no tiene descenso y Primera no tiene ascenso', () => {
    expect(zoneOf(20, 20, 5).id).toBe('NONE')
    expect(zoneOf(2, 20, 5).id).toBe('PROMOTION')
    expect(zoneOf(1, 20, 1).id).toBe('NONE')
    expect(zoneOf(19, 20, 1).id).toBe('RELEGATION')
    expect(zoneLegend(5).map(([z]) => z.id)).toEqual(['PROMOTION'])
    expect(zoneLegend(1).map(([z]) => z.id)).toEqual(['RELEGATION'])
    expect(zoneLegend(3).map(([z]) => z.id)).toEqual(['PROMOTION', 'RELEGATION'])
  })
  it('diferencia de gol y racha', () => {
    expect(goalDiff({ goals_for: 3, goals_against: 5 })).toBe(-2)
    expect(formatDiff(2)).toBe('+2')
    expect(parseForm('V,E,D,V,V,V,E')).toEqual(['V', 'E', 'D', 'V', 'V'])
    expect(parseForm(null)).toEqual([])
  })
})

describe('pantalla Tabla', () => {
  beforeEach(() => { club.league_tier = 5; getStandings.mockReset(); getStandings.mockImplementation(async () => rows) })

  it('en la última división no marca descenso ni muestra el reducido', async () => {
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    const table = await screen.findByRole('table', { name: 'Tabla de posiciones' })
    expect(within(table).queryByText(/Zona de descenso/)).not.toBeInTheDocument()
    expect(screen.getByText('En esta división no hay descensos')).toBeInTheDocument()
    expect(screen.queryByText(/Reducido/i)).not.toBeInTheDocument()
  })

  it('en una división intermedia marca a los tres últimos en descenso', async () => {
    club.league_tier = 3
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    const table = await screen.findByRole('table', { name: 'Tabla de posiciones' })
    expect(within(table).getAllByText(/Zona de descenso/)).toHaveLength(3)
  })

  it('si la carga falla no inventa una tabla: avisa y deja reintentar', async () => {
    getStandings.mockRejectedValueOnce(new Error('fallo de red'))
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    expect(await screen.findByText('No pudimos cargar la tabla')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('table', { name: 'Tabla de posiciones' })).toBeInTheDocument()
  })

  it('lista los clubes en una tabla accesible y resalta al propio', async () => {
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    const table = await screen.findByRole('table', { name: 'Tabla de posiciones' })
    expect(within(table).getAllByRole('row')).toHaveLength(11)
    const mine = within(table).getByText('Club Atlético Potrero').closest('tr')
    expect(mine).toHaveAttribute('aria-current', 'true')
    expect(within(mine).getByText('Vos')).toBeInTheDocument()
  })

  it('ya no hay botón de recargar: la tabla se actualiza sola', async () => {
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    await screen.findByRole('table')
    expect(screen.queryByRole('button', { name: 'Recargar tabla' })).not.toBeInTheDocument()
  })

  it('"Todas las ligas" abre el panel con los datos de todas las ligas y la pirámide abre el suyo', async () => {
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: /Todas las ligas/ }))
    expect(await screen.findByRole('dialog', { name: 'Todas las ligas' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Pirámide/ }))
    expect(await screen.findByRole('dialog', { name: 'Pirámide' })).toBeInTheDocument()
  })
})
