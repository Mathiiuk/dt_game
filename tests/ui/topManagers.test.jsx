import React from 'react'
import { render as rtlRender, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { fetchTopManagers } = vi.hoisted(() => ({ fetchTopManagers: vi.fn() }))
vi.mock('../../src/lib/publicRanking', () => ({ fetchTopManagers }))

const render = (ui) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>)

import TopManagersTable from '../../src/features/home/TopManagersTable'

const rows = [
  { rank: 1, name: 'Ramón Díaz', points: 10200, titles: 15, won: 480, legend: true },
  { rank: 2, name: 'Ana Gómez', points: 1301, titles: 2, won: 15, legend: false, slug: 'ana-gomez-a1b2' },
  { rank: 3, name: 'Luis Peña', points: 1264, titles: 0, won: 4, legend: false }
]

describe('tabla "Los mejores DT" de la portada', () => {
  beforeEach(() => { fetchTopManagers.mockReset() })

  it('muestra el puesto, el DT y los puntos de legado, con un título claro', async () => {
    fetchTopManagers.mockResolvedValue(rows)
    render(<TopManagersTable />)
    const table = await screen.findByRole('table', { name: /mejores DT/i })
    expect(within(table).getByText('Ana Gómez')).toBeInTheDocument()
    expect(within(table).getByText('1.301')).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(screen.getByText(/puntos de legado/i)).toBeInTheDocument()
  })

  it('marca a las leyendas con un sello y no a los DT del juego', async () => {
    fetchTopManagers.mockResolvedValue(rows)
    render(<TopManagersTable />)
    const table = await screen.findByRole('table', { name: /mejores DT/i })
    const legend = within(table).getByText('Ramón Díaz').closest('tr')
    expect(within(legend).getByText('Leyenda')).toBeInTheDocument()
    const human = within(table).getByText('Ana Gómez').closest('tr')
    expect(within(human).queryByText('Leyenda')).toBeNull()
  })

  it('explica que las leyendas son los DT más ganadores y que hay que superarlas', async () => {
    fetchTopManagers.mockResolvedValue(rows)
    render(<TopManagersTable />)
    await screen.findByRole('table', { name: /mejores DT/i })
    expect(screen.getByText(/leyendas son los DT más ganadores/i)).toBeInTheDocument()
  })

  it('los DT del juego enlazan a su perfil; las leyendas no', async () => {
    fetchTopManagers.mockResolvedValue(rows)
    render(<TopManagersTable />)
    const table = await screen.findByRole('table', { name: /mejores DT/i })
    expect(within(table).getByRole('link', { name: 'Ana Gómez' })).toHaveAttribute('href', '/dt/ana-gomez-a1b2')
    expect(within(table).queryByRole('link', { name: 'Ramón Díaz' })).toBeNull()
    expect(within(table).queryByRole('link', { name: 'Luis Peña' })).toBeNull()
  })

  it('sin DT todavía invita a ser el primero', async () => {
    fetchTopManagers.mockResolvedValue([])
    render(<TopManagersTable />)
    expect(await screen.findByText(/todavía no hay/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('si falla la carga no muestra nada (la portada no se rompe)', async () => {
    fetchTopManagers.mockRejectedValue(new Error('sin red'))
    const { container } = render(<TopManagersTable />)
    await vi.waitFor(() => expect(container.querySelector('section')).toBeNull())
  })

  it('mientras carga reserva el lugar, sin saltos', () => {
    fetchTopManagers.mockReturnValue(new Promise(() => {}))
    render(<TopManagersTable />)
    expect(screen.getByRole('region', { name: /mejores DT/i })).toHaveAttribute('aria-busy', 'true')
  })
})
