import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MatchStats from '../../src/features/match/MatchStats'
import MatchTimeline from '../../src/features/match/MatchTimeline'
import { Pager } from '../../src/components/ui/pager'

const stats = {
  possession: { home: 62, away: 38 },
  shots: { home: 9, away: 4 },
  shotsOnTarget: { home: 5, away: 1 },
  fouls: { home: 7, away: 11 },
  corners: { home: 3, away: 2 },
  yellowCards: { home: 1, away: 2 },
  redCards: { home: 0, away: 1 }
}

describe('estadísticas del partido', () => {
  it('cerradas muestran la posesión y al tocar se despliega el detalle (y al cerrar vuelve)', () => {
    render(<MatchStats stats={stats} homeName="Potrero" awayName="Rival" />)
    const toggle = screen.getByRole('button', { name: /estadísticas/i })
    expect(screen.getByRole('img', { name: 'Posesión: 62% a 38%' })).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById('stats-detail')).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById('stats-detail')).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByText('Tiros')).toBeInTheDocument()
    expect(screen.getByText('1 / 0')).toBeInTheDocument()
    expect(screen.getByText('2 / 1')).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('sin estadísticas no muestra nada', () => {
    const { container } = render(<MatchStats stats={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('relato del partido', () => {
  it('la jugada más nueva va arriba con su tipo y las anteriores debajo', () => {
    const events = [
      { minute: 10, type: 'GOAL', team: 'home', text: 'Gol de prueba.' },
      { minute: 4, type: 'CARD_YELLOW', team: 'away', text: 'Amarilla de prueba.' },
      { minute: 7, type: 'SAVE', team: 'home', text: 'Atajada de prueba.' }
    ]
    render(<MatchTimeline events={events} matchState="playing" />)
    expect(screen.getByText('Gol')).toBeInTheDocument()
    const before = screen.getByRole('list', { name: 'Jugadas anteriores' })
    const texts = [...before.querySelectorAll('li')].map(li => li.textContent)
    expect(texts[0]).toContain('Atajada de prueba.')
    expect(texts[1]).toContain('Amarilla de prueba.')
  })

  it('antes de empezar y sin jugadas muestra un aviso', () => {
    render(<MatchTimeline events={[]} matchState="pre-match" />)
    expect(screen.getByText(/charla táctica/)).toBeInTheDocument()
  })
})

describe('lista paginada', () => {
  const items = ['a', 'b', 'c', 'd', 'e']
  const renderPager = () => render(<Pager items={items} perPage={2} render={(x) => <p key={x}>{`item ${x}`}</p>} />)

  it('muestra una página por vez y las flechas respetan los extremos', () => {
    renderPager()
    expect(screen.getByText('item a')).toBeInTheDocument()
    expect(screen.queryByText('item c')).not.toBeInTheDocument()
    const prev = screen.getByRole('button', { name: 'Página anterior' })
    const next = screen.getByRole('button', { name: 'Página siguiente' })
    expect(prev).toBeDisabled()
    fireEvent.click(next)
    expect(screen.getByText('item c')).toBeInTheDocument()
    fireEvent.click(next)
    expect(screen.getByText('item e')).toBeInTheDocument()
    expect(next).toBeDisabled()
    fireEvent.click(prev)
    expect(screen.getByText('item c')).toBeInTheDocument()
  })

  it('con una sola página los controles no estorban', () => {
    render(<Pager items={['x']} perPage={3} render={(i) => <p key={i}>{i}</p>} />)
    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
  })
})
