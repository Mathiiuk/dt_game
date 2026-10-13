import React from 'react'
import { render, screen } from '@testing-library/react'
import DesktopPitch from '../../src/features/match/DesktopPitch'
import MatchProgress from '../../src/features/match/MatchProgress'
import { getLayout } from '../../src/domain/formations'

const layout = getLayout('4-4-2')

describe('cancha grande de escritorio', () => {
  it('no se dibuja antes del pitazo', () => {
    const { container } = render(<DesktopPitch events={[]} minute={0} matchState="pre-match" homeLayout={layout} awayLayout={layout} />)
    expect(container.firstChild).toBeNull()
  })

  it('dibuja los 22 jugadores y la pelota', () => {
    const { container } = render(<DesktopPitch events={[]} minute={10} matchState="playing" homeLayout={layout} awayLayout={layout} />)
    expect(container.querySelectorAll('[data-testid="pitch-dot-home"]')).toHaveLength(11)
    expect(container.querySelectorAll('[data-testid="pitch-dot-away"]')).toHaveLength(11)
    expect(screen.getByTestId('live-ball')).toBeInTheDocument()
  })

  it('muestra el cartel de gol y es decorativa para lectores de pantalla', () => {
    const events = [{ type: 'GOAL', team: 'home', minute: 12 }]
    const { container } = render(<DesktopPitch events={events} minute={12} matchState="playing" homeLayout={layout} awayLayout={layout} />)
    expect(screen.getByTestId('goal-flash')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('progreso del partido', () => {
  it('marca el minuto y los goles, tarjetas y cambios ya ocurridos', () => {
    const events = [
      { type: 'GOAL', team: 'home', minute: 10 },
      { type: 'CARD_YELLOW', team: 'away', minute: 30 },
      { type: 'GOAL', team: 'away', minute: 80 }
    ]
    render(<MatchProgress events={events} minute={45} />)
    const bar = screen.getByRole('progressbar', { name: /minuto/i })
    expect(bar).toHaveAttribute('aria-valuenow', '45')
    expect(screen.getAllByTestId('progress-marker')).toHaveLength(2)
  })
})
