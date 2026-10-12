import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { api } = vi.hoisted(() => ({ api: { get: vi.fn() } }))
vi.mock('../../src/api/legendRoad', () => ({ legendRoadApi: api }))

const share = vi.fn()
vi.mock('../../src/lib/shareMatch', () => ({ shareMoment: (...a) => share(...a) }))

import LegendRoadCard from '../../src/features/manager/LegendRoadCard'

const legends = [
  { name: 'Ramón Díaz', era: 'Década del 90 - hoy', titles: 17, points: 10200 },
  { name: 'Guillermo Stábile', era: '1930 - 1960', titles: 13, points: 7800 }
]
const data = (points) => ({ me: { points, titles: 1, played: 30, won: 15 }, legends })

describe('camino a la leyenda', () => {
  beforeEach(() => { api.get.mockReset(); share.mockReset() })

  it('dice cuál es la próxima leyenda y cuántos puntos faltan', async () => {
    api.get.mockResolvedValue(data(5000))
    render(<LegendRoadCard />)
    expect(await screen.findByText(/te faltan 2\.800 puntos para alcanzar a guillermo stábile/i)).toBeInTheDocument()
    expect(screen.getByText('5.000')).toBeInTheDocument()
  })

  it('lista a las leyendas con sus títulos y marca las superadas', async () => {
    api.get.mockResolvedValue(data(9000))
    render(<LegendRoadCard />)
    const list = await screen.findByRole('list', { name: /leyendas/i })
    expect(within(list).getByText('Ramón Díaz')).toBeInTheDocument()
    expect(within(list).getByText(/17 títulos/i)).toBeInTheDocument()
    expect(within(list).getAllByText(/superada/i)).toHaveLength(1)
  })

  it('cada leyenda tiene su barra de avance accesible', async () => {
    api.get.mockResolvedValue(data(5000))
    render(<LegendRoadCard />)
    const bars = await screen.findAllByRole('progressbar')
    expect(bars).toHaveLength(2)
    expect(bars[1]).toHaveAttribute('aria-valuenow', String(Math.round((5000 / 7800) * 100)))
  })

  it('quien superó a todas lo festeja', async () => {
    api.get.mockResolvedValue(data(20000))
    render(<LegendRoadCard />)
    expect(await screen.findByText(/superaste a todas las leyendas/i)).toBeInTheDocument()
  })

  it('al superar a una leyenda ofrece compartirlo; sin ninguna superada, no', async () => {
    api.get.mockResolvedValue(data(9000))
    share.mockResolvedValue('shared')
    const { unmount } = render(<LegendRoadCard />)
    await userEvent.click(await screen.findByRole('button', { name: /compartir/i }))
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ kind: 'legend', big: 'Guillermo Stábile' }))
    unmount()
    api.get.mockResolvedValue(data(100))
    render(<LegendRoadCard />)
    await screen.findByRole('list', { name: /leyendas/i })
    expect(screen.queryByRole('button', { name: /compartir/i })).toBeNull()
  })

  it('si falla la carga o no hay DT no muestra nada (la pantalla no se rompe)', async () => {
    api.get.mockRejectedValue(new Error('sin red'))
    const { container, rerender } = render(<LegendRoadCard />)
    await vi.waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    api.get.mockResolvedValue({ me: null, legends })
    rerender(<LegendRoadCard key="2" />)
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(2))
    expect(container).toBeEmptyDOMElement()
  })
})
