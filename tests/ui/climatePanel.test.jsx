import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const state = { current: null }
const saveDifficulty = vi.fn(async () => {})
const getRecent = vi.fn(async () => [])

vi.mock('../../src/api/climate', () => ({
  climateApi: {
    load: vi.fn(async () => state.current),
    saveDifficulty: (...a) => saveDifficulty(...a),
    getRecent: (...a) => getRecent(...a)
  }
}))

import { ClimatePanel, ConsequenceFeed } from '../../src/features/dashboard/ClimatePanel'
import { climateVisibility } from '../../src/domain/consequences'
import { climateHeadline } from '../../src/domain/barra'

const club = { id: 'c1', fans_confidence: 62, board_confidence: 70, squad_morale: 48, budget: 18500 }

describe('visibilidad gradual del clima', () => {
  it('las primeras semanas solo hinchada y dirigencia; después se suma el resto', () => {
    expect(climateVisibility(1)).toEqual({ fans: true, board: true, cash: false, locker: false, pressure: false, barra: false })
    expect(climateVisibility(5)).toMatchObject({ cash: true, locker: true, pressure: false })
    expect(climateVisibility(9)).toMatchObject({ pressure: true, barra: true })
  })

  it('la frase del clima cambia con la barra y con el clima', () => {
    expect(climateHeadline('FLOWS')).toMatch(/fluye/i)
    expect(climateHeadline('CRISIS')).toMatch(/presión/i)
    expect(climateHeadline('CRISIS', 'INVASION')).toMatch(/vestuario/i)
  })
})

describe('tarjeta de clima', () => {
  beforeEach(() => {
    saveDifficulty.mockClear()
    state.current = { climate: 'CRISIS', pressure: 63, barra_stage: 'PRESSURES', suspended_matches: 0, difficulty: 'NORMAL' }
  })

  it('en la primera semana muestra solo hinchada y dirigencia', async () => {
    render(<ClimatePanel club={club} gameDate="2026-07-01" />)
    expect(screen.getByText('Hinchada')).toBeInTheDocument()
    expect(screen.getByText('Dirigencia')).toBeInTheDocument()
    expect(screen.queryByText('Vestuario')).not.toBeInTheDocument()
    expect(screen.queryByText(/Presión:/)).not.toBeInTheDocument()
    expect(screen.getByText(/Primeras semanas/)).toBeInTheDocument()
  })

  it('con la carrera avanzada muestra presión, barra, vestuario y caja', async () => {
    render(<ClimatePanel club={club} gameDate="2026-10-15" />)
    expect(await screen.findByText('Crisis')).toBeInTheDocument()
    expect(screen.getByText('Presiona')).toBeInTheDocument()
    expect(screen.getByText('63')).toBeInTheDocument()
    expect(screen.getByText('Vestuario')).toBeInTheDocument()
    expect(screen.getByText('$18.500')).toBeInTheDocument()
    expect(screen.getByText(/banderas en el alambrado/)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Dificultad' })).toBeNull()
  })

  it('cambiar la dificultad la guarda', async () => {
    render(<ClimatePanel club={club} gameDate="2026-10-15" showDifficulty />)
    await userEvent.click(await screen.findByRole('radio', { name: 'Realista' }))
    await waitFor(() => expect(saveDifficulty).toHaveBeenCalledWith('c1', 'REALISTIC'))
  })
})

describe('Esto pasó por tu decisión', () => {
  it('sin consecuencias explica qué va a aparecer', async () => {
    getRecent.mockResolvedValueOnce([])
    render(<ConsequenceFeed clubId="c1" />)
    expect(await screen.findByText(/Todavía no hay consecuencias/)).toBeInTheDocument()
  })

  it('lista las últimas consecuencias con su semana', async () => {
    getRecent.mockResolvedValueOnce([
      { id: 'a', message: 'Subiste la entrada y la hinchada se queja.', week_number: 12 },
      { id: 'b', message: 'Vendiste al ídolo del club.', week_number: 11 }
    ])
    render(<ConsequenceFeed clubId="c1" />)
    expect(await screen.findByText('Subiste la entrada y la hinchada se queja.')).toBeInTheDocument()
    expect(screen.getByText('Semana 11')).toBeInTheDocument()
  })

  it('los combos y los círculos viciosos aparecen con su insignia en el feed', async () => {
    getRecent.mockResolvedValueOnce([
      { id: 'c', source: 'COMBO', message: 'La fiesta del pueblo. El barrio se vuelca a la cancha.', week_number: 9 },
      { id: 'v', source: 'COMBO', message: 'Círculo vicioso: plantel reventado. El cuerpo médico pide frenar.', week_number: 8 },
      { id: 'n', source: 'SALE', message: 'Vendiste al ídolo del club.', week_number: 7 }
    ])
    render(<ConsequenceFeed clubId="c1" />)
    expect(await screen.findByText('Combo')).toBeInTheDocument()
    expect(screen.getByText('Círculo vicioso')).toBeInTheDocument()
    // Solo las filas de combos llevan insignia
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('tono visual del clima', () => {
  const look = async (climate) => {
    state.current = { climate, pressure: 70, barra_stage: 'CALM', suspended_matches: 0, difficulty: 'NORMAL' }
    const { container, unmount } = render(<ClimatePanel club={club} gameDate="2026-10-15" />)
    await screen.findByText(climate === 'FLOWS' ? 'Fluye' : climate === 'TENSION' ? 'Tensión' : climate === 'CRISIS' ? 'Crisis' : 'Caos')
    const card = container.querySelector('[data-climate]')
    const result = { key: card.getAttribute('data-climate'), cls: card.className }
    unmount()
    return result
  }

  it('cada clima pinta la tarjeta de un tono distinto: del verde al rojo', async () => {
    const flows = await look('FLOWS')
    const tension = await look('TENSION')
    const crisis = await look('CRISIS')
    const chaos = await look('CHAOS')
    expect(flows.cls).toMatch(/accent/)
    expect(tension.cls).toMatch(/warning/)
    expect(crisis.cls).toMatch(/danger/)
    expect(chaos.cls).toMatch(/danger/)
    expect(new Set([flows.cls, tension.cls, crisis.cls, chaos.cls]).size).toBe(4)
    expect([flows.key, chaos.key]).toEqual(['FLOWS', 'CHAOS'])
  })

  it('en las primeras semanas la tarjeta no se tiñe: todavía no se muestra el clima', () => {
    const { container } = render(<ClimatePanel club={club} gameDate="2026-07-01" />)
    expect(container.querySelector('[data-climate]')).toBeNull()
  })
})
