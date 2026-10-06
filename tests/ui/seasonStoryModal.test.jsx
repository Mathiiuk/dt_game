import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const executeSeasonClose = vi.fn(async () => ({
  userPosition: 8, isPromoted: false, totalPrizeAwarded: 2500, newBudget: 31500, newSeasonYear: 2027, championClub: { club_id: 'otro' }
}))
const getSeasonSummaryData = vi.fn(async () => ({ state: { favors: 2, scandals: 0 }, counts: { BARRA: 5, SALE: 1 } }))

vi.mock('../../src/api/seasonClose', () => ({ seasonCloseApi: { executeSeasonClose: (...a) => executeSeasonClose(...a) } }))
vi.mock('../../src/api/climate', () => ({ climateApi: { getSeasonSummaryData: (...a) => getSeasonSummaryData(...a) } }))
vi.mock('../../src/context/GameContext', () => ({ useGameContext: () => ({ refreshContext: vi.fn() }) }))

import SeasonCloseModal from '../../src/features/season/SeasonCloseModal'

const club = { id: 'c1', name: 'Potrero' }

describe('gala de fin de temporada', () => {
  beforeEach(() => { executeSeasonClose.mockClear(); getSeasonSummaryData.mockClear() })

  it('muestra los premios según la posición final, en la escala de la economía chica', () => {
    render(<SeasonCloseModal club={club} careerId="k1" seasonYear={2026} onClose={() => {}} />)
    expect(screen.getByText(/\$1\.000 a \$12\.000/)).toBeInTheDocument()
  })

  it('al cerrar la temporada cuenta la historia del año con las consecuencias registradas', async () => {
    render(<SeasonCloseModal club={club} careerId="k1" seasonYear={2026} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Cerrar temporada y abrir el nuevo año/ }))
    expect(await screen.findByText('Una temporada de mitad de tabla')).toBeInTheDocument()
    expect(screen.getByText(/Potrero terminó 8\.º/)).toBeInTheDocument()
    expect(screen.getByText(/La barra anduvo cerca durante 5 semanas/)).toBeInTheDocument()
    expect(screen.getByText(/Aceptaste 2 favores/)).toBeInTheDocument()
    expect(getSeasonSummaryData).toHaveBeenCalledWith('c1', 2026)
  })

  it('si no se puede armar el resumen, el cierre igual se completa', async () => {
    getSeasonSummaryData.mockRejectedValueOnce(new Error('sin red'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<SeasonCloseModal club={club} careerId="k1" seasonYear={2026} onClose={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /Cerrar temporada y abrir el nuevo año/ }))
    expect(await screen.findByText('Transición completada')).toBeInTheDocument()
    expect(screen.queryByText('Una temporada de mitad de tabla')).not.toBeInTheDocument()
  })
})
