import React from 'react'
import { render, screen } from '@testing-library/react'
import LivePitch from '../../src/features/match/LivePitch'

const ev = (minute, type, team) => ({ minute, type, team })
const base = { matchState: 'playing', homeColor: '#1F4E9D', awayColor: '#BE2A35' }

describe('cancha en vivo', () => {
  it('es decorativa: oculta a lectores de pantalla (el relato ya cuenta todo)', () => {
    const { container } = render(<LivePitch {...base} events={[]} minute={10} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('no se muestra antes del pitazo', () => {
    const { container } = render(<LivePitch {...base} matchState="pre-match" events={[]} minute={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('la pelota se mueve hacia el arco del equipo que ataca', () => {
    const { rerender } = render(<LivePitch {...base} events={[ev(30, 'SHOT', 'home')]} minute={30} />)
    const home = Number(screen.getByTestId('live-ball').getAttribute('data-x'))
    rerender(<LivePitch {...base} events={[ev(30, 'SHOT', 'away')]} minute={30} />)
    const away = Number(screen.getByTestId('live-ball').getAttribute('data-x'))
    expect(home).toBeGreaterThan(80)
    expect(away).toBeLessThan(20)
  })

  it('al meter un gol aparece el cartel de gol (una sola vez por gol) y se apaga después', () => {
    const { rerender } = render(<LivePitch {...base} events={[ev(44, 'GOAL', 'home')]} minute={44} />)
    expect(screen.getByTestId('goal-flash')).toBeInTheDocument()
    rerender(<LivePitch {...base} events={[ev(44, 'GOAL', 'home')]} minute={48} />)
    expect(screen.queryByTestId('goal-flash')).toBeNull()
  })

  it('una roja se ve en la cancha', () => {
    render(<LivePitch {...base} events={[ev(60, 'CARD_RED', 'away')]} minute={60} />)
    expect(screen.getByTestId('card-flash')).toHaveAttribute('data-kind', 'red')
  })

  it('al terminar el partido sigue visible, con la pelota en el medio', () => {
    render(<LivePitch {...base} matchState="finished" events={[ev(90, 'END', 'home')]} minute={90} />)
    expect(screen.getByTestId('live-ball')).toBeInTheDocument()
  })

  it('el banco del equipo que hizo el gol festeja', () => {
    render(<LivePitch {...base} events={[ev(44, 'GOAL', 'away')]} minute={44} />)
    expect(screen.getByTestId('bench-away')).toHaveAttribute('data-cheer', 'true')
    expect(screen.getByTestId('bench-home')).toHaveAttribute('data-cheer', 'false')
  })
})
