import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DirectionPanel from '../../src/features/match/DirectionPanel'
import { SHOUT_TYPES } from '../../src/api/matchEngine'

const base = {
  matchState: 'playing', paused: false, onTogglePause: vi.fn(), speed: 'x1', onSpeed: vi.fn(), onSkip: vi.fn(),
  shoutWait: 0, activeOrder: null, onApplyOrder: vi.fn(), subsLeft: 5, subsMade: [], onOpenSubs: vi.fn(), onStart: vi.fn(), onSummary: vi.fn()
}
const renderIt = (props = {}) => render(<DirectionPanel {...base} {...props} />)

describe('dirección técnica (escritorio)', () => {
  beforeEach(() => Object.values(base).forEach(v => v?.mockClear?.()))

  it('reúne el control del partido: pausa, velocidad y saltear', async () => {
    renderIt()
    await userEvent.click(screen.getByRole('button', { name: 'Pausa' }))
    expect(base.onTogglePause).toHaveBeenCalled()
    const speeds = screen.getByRole('radiogroup', { name: /velocidad del partido/i })
    await userEvent.click(within(speeds).getByRole('radio', { name: 'x2' }))
    expect(base.onSpeed).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /saltear partido/i }))
    expect(base.onSkip).toHaveBeenCalled()
  })

  it('en pausa el botón dice Reanudar y queda marcado', () => {
    renderIt({ paused: true })
    expect(screen.getByRole('button', { name: 'Reanudar' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('las órdenes del banco son tarjetas con su efecto a la vista', async () => {
    renderIt()
    const group = screen.getByRole('group', { name: /órdenes desde el banco/i })
    for (const o of SHOUT_TYPES) {
      expect(within(group).getByRole('button', { name: new RegExp(o.label.replace(/[¡!¿?]/g, '').slice(0, 14)) })).toBeInTheDocument()
    }
    expect(within(group).getByText(/\+20% ataque/i)).toBeInTheDocument()
    await userEvent.click(within(group).getByRole('button', { name: /todos al ataque/i }))
    expect(base.onApplyOrder).toHaveBeenCalledWith(SHOUT_TYPES.find(o => o.id === 'SHOUT_ATTACK'))
  })

  it('con enfriamiento las órdenes se bloquean y dicen cuánto falta', async () => {
    renderIt({ shoutWait: 6 })
    const group = screen.getByRole('group', { name: /órdenes desde el banco/i })
    for (const b of within(group).getAllByRole('button')) expect(b).toBeDisabled()
    expect(screen.getByText(/podés volver a dar una orden en 6 min/i)).toBeInTheDocument()
  })

  it('la orden activa queda marcada', () => {
    renderIt({ activeOrder: 'SHOUT_LOCK' })
    expect(screen.getByRole('button', { name: /aseguren el resultado/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cambios: muestra cuántos quedan y abre el diálogo de cambios', async () => {
    renderIt({ subsLeft: 3 })
    expect(screen.getByText(/3 cambios disponibles/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /hacer un cambio/i }))
    expect(base.onOpenSubs).toHaveBeenCalled()
  })

  it('sin cambios disponibles el botón se bloquea', () => {
    renderIt({ subsLeft: 0 })
    expect(screen.getByRole('button', { name: /hacer un cambio/i })).toBeDisabled()
    expect(screen.getByText(/ya hiciste todos los cambios/i)).toBeInTheDocument()
  })

  it('lista los cambios ya hechos con el minuto', () => {
    renderIt({ subsLeft: 4, subsMade: [{ minute: 46, outName: 'Juan Pérez', inName: 'Luis Gómez' }] })
    const list = screen.getByRole('list', { name: /cambios realizados/i })
    expect(within(list).getByText(/46'/)).toBeInTheDocument()
    expect(within(list).getByText(/Juan Pérez/)).toBeInTheDocument()
    expect(within(list).getByText(/Luis Gómez/)).toBeInTheDocument()
  })

  it('antes del pitazo ofrece comenzar y, al final, ir al resumen', async () => {
    const { unmount } = renderIt({ matchState: 'pre-match' })
    await userEvent.click(screen.getByRole('button', { name: /comenzar partido/i }))
    expect(base.onStart).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Pausa' })).toBeNull()
    unmount()
    renderIt({ matchState: 'finished' })
    await userEvent.click(screen.getByRole('button', { name: /resumen/i }))
    expect(base.onSummary).toHaveBeenCalled()
  })
})
