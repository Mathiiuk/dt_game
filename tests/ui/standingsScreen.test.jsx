import React from 'react'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { zoneOf, goalDiff, formatDiff, parseForm } from '../../src/domain/standings'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const rows = Array.from({ length: 10 }, (_, i) => ({
  id: `s${i}`, club_id: i === 3 ? 'c1' : `x${i}`, clubs: { name: i === 3 ? 'Club Atlético Potrero' : `Rival ${i}` },
  played: 5, won: 3, drawn: 1, lost: 1, goals_for: 10 - i, goals_against: 4, points: 30 - i, form: 'V,E,D'
}))
const getStandings = vi.fn(async () => rows)
vi.mock('../../src/api/competition', () => ({ competitionApi: { getStandings: (...a) => getStandings(...a) } }))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ club: { id: 'c1' }, loading: false, confirmAction: vi.fn(async () => false) }) }))
vi.mock('../../src/features/competition/LeaguePyramidModal', () => ({ default: () => <div role="dialog" aria-label="Pirámide" /> }))

import StandingsScreen from '../../src/features/competition/StandingsScreen'

describe('dominio de la tabla', () => {
  it('asigna zonas según posición y tamaño de la tabla', () => {
    expect(zoneOf(1, 20).id).toBe('PROMOTION')
    expect(zoneOf(5, 20).id).toBe('PLAYOFF')
    expect(zoneOf(10, 20).id).toBe('NONE')
    expect(zoneOf(18, 20).id).toBe('RELEGATION')
    expect(zoneOf(8, 10).id).toBe('RELEGATION')
  })
  it('diferencia de gol y racha', () => {
    expect(goalDiff({ goals_for: 3, goals_against: 5 })).toBe(-2)
    expect(formatDiff(2)).toBe('+2')
    expect(parseForm('V,E,D,V,V,V,E')).toEqual(['V', 'E', 'D', 'V', 'V'])
    expect(parseForm(null)).toEqual([])
  })
})

describe('pantalla Tabla', () => {
  it('lista los clubes en una tabla accesible y resalta al propio', async () => {
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    const table = await screen.findByRole('table', { name: 'Tabla de posiciones' })
    expect(within(table).getAllByRole('row')).toHaveLength(11)
    const mine = within(table).getByText('Club Atlético Potrero').closest('tr')
    expect(mine).toHaveAttribute('aria-current', 'true')
    expect(within(mine).getByText('Vos')).toBeInTheDocument()
  })

  it('recargar vuelve a pedir la tabla y la pirámide abre su panel', async () => {
    render(<MemoryRouter><StandingsScreen /></MemoryRouter>)
    await screen.findByRole('table')
    await userEvent.click(screen.getByRole('button', { name: 'Recargar tabla' }))
    await waitFor(() => expect(getStandings).toHaveBeenCalledTimes(2))
    await userEvent.click(screen.getByRole('button', { name: /Pirámide y reducido/ }))
    expect(await screen.findByRole('dialog', { name: 'Pirámide' })).toBeInTheDocument()
  })
})
