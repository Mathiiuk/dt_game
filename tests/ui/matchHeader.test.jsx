import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MatchHeader from '../../src/features/match/MatchHeader'

// El marcador siempre va en orden local - visitante, igual que los nombres
describe('marcador del encabezado del partido', () => {
  const base = { clubName: 'Mi Club', opponentName: 'Rival', homeClub: {}, awayClub: {}, minute: 90, matchState: 'finished', onBack: () => {} }

  it('de local muestra el marcador sin invertir', () => {
    const { container } = render(<MatchHeader {...base} isHome score={{ home: 2, away: 0 }} />)
    expect(container.querySelector('.font-mono.font-black').textContent).toBe('2')
    expect(screen.getAllByRole('heading')[0].textContent).toBe('Mi Club')
  })

  it('de visitante el rival (local) lleva su propio gol a la izquierda', () => {
    const { container } = render(<MatchHeader {...base} isHome={false} score={{ home: 0, away: 2 }} />)
    const nums = [...container.querySelectorAll('span.font-mono.font-black')].map(n => n.textContent)
    expect(nums).toEqual(['0', '2'])
    expect(screen.getAllByRole('heading')[0].textContent).toBe('Rival')
  })
})
