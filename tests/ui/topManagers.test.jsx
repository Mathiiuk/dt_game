import React from 'react'
import { render, screen, within } from '@testing-library/react'

const { fetchTopManagers } = vi.hoisted(() => ({ fetchTopManagers: vi.fn() }))
vi.mock('../../src/lib/publicRanking', () => ({ fetchTopManagers }))

import TopManagersTable from '../../src/features/home/TopManagersTable'

const rows = [
  { rank: 1, name: 'Ana Gómez', points: 1301, titles: 2, won: 15 },
  { rank: 2, name: 'Luis Peña', points: 1264, titles: 0, won: 4 }
]

describe('tabla "Los mejores DT" de la portada', () => {
  beforeEach(() => { fetchTopManagers.mockReset() })

  it('muestra el puesto, el DT y los puntos de legado, con un título claro', async () => {
    fetchTopManagers.mockResolvedValue(rows)
    render(<TopManagersTable />)
    const table = await screen.findByRole('table', { name: /mejores DT/i })
    expect(within(table).getByText('Ana Gómez')).toBeInTheDocument()
    expect(within(table).getByText('1.301')).toBeInTheDocument()
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(screen.getByText(/puntos de legado/i)).toBeInTheDocument()
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
