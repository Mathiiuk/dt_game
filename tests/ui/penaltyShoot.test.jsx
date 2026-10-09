// El penal a favor: la pelota ya no va siempre al mismo lugar
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PenaltyShoot } from '../../src/features/match/PenaltyGoal'

const kickAndRead = async (randomValues) => {
  let i = 0
  const rnd = vi.spyOn(Math, 'random').mockImplementation(() => randomValues[i++ % randomValues.length])
  const { container, unmount } = render(<PenaltyShoot takerName="Cristian Molina" onDone={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /Apuntar a la derecha/ }))
  fireEvent.click(screen.getByRole('button', { name: /Patear/ }))
  await act(async () => { await new Promise(r => setTimeout(r, 60)) })
  const ball = [...container.querySelectorAll('span[aria-hidden="true"]')].find(el => el.style.left && el.style.bottom)
  const spot = { left: ball.style.left, bottom: ball.style.bottom }
  unmount()
  rnd.mockRestore()
  return spot
}

describe('penal a favor con la pelota distinta cada vez', () => {
  it('con distinto azar la pelota llega a lugares distintos de la misma zona', async () => {
    const a = await kickAndRead([0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
    const b = await kickAndRead([0.9, 0.8, 0.7, 0.3, 0.2, 0.1])
    expect(a.left).not.toBe('50%')
    expect(a).not.toEqual(b)
  })

  it('la barra de potencia arranca en un punto distinto cada vez', () => {
    const read = (v) => {
      const rnd = vi.spyOn(Math, 'random').mockReturnValue(v)
      const { container, unmount } = render(<PenaltyShoot takerName="Cristian Molina" onDone={() => {}} />)
      fireEvent.click(screen.getByRole('button', { name: /Apuntar a la izquierda/ }))
      const marker = container.querySelector('.penalty-marker')
      const style = { delay: marker.style.animationDelay, duration: marker.style.animationDuration }
      unmount()
      rnd.mockRestore()
      return style
    }
    expect(read(0.1)).not.toEqual(read(0.9))
  })
})
