// Duelo de declaraciones antes del clásico: tres rondas y el resultado
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DerbyDuel from '../../src/features/match/DerbyDuel'
import { JAB_TYPES } from '../../src/domain/derbyDuel'

const seeded = (seed = 3) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

// Contesta cada ronda con el tono pedido (el botón se reconoce por la etiqueta del tono)
const answerAll = (label) => {
  for (let i = 0; i < 3; i++) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }))
    fireEvent.click(screen.getByRole('button', { name: /Siguiente|Ver resultado/ }))
  }
}

describe('duelo de declaraciones', () => {
  it('muestra la provocación del DT rival con sus tres respuestas', () => {
    render(<DerbyDuel rivalName="Huracán" onFinish={() => {}} rng={seeded()} />)
    expect(screen.getByLabelText('Duelo de declaraciones')).toBeInTheDocument()
    expect(screen.getByLabelText('Ronda 1 de 3')).toBeInTheDocument()
    expect(screen.getByText(/Huracán:/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Plantarse/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Con calma/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Con respeto/ })).toBeInTheDocument()
  })

  it('al contestar muestra cómo salió la ronda y deja pasar a la siguiente', () => {
    render(<DerbyDuel rivalName="Huracán" onFinish={() => {}} rng={seeded()} />)
    fireEvent.click(screen.getByRole('button', { name: /Con calma/ }))
    expect(screen.getByText(/Ganaste la ronda|Ronda pareja|Caíste en la trampa/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Plantarse/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByLabelText('Ronda 2 de 3')).toBeInTheDocument()
  })

  it('al terminar las tres rondas da el resultado y avisa con el puntaje', () => {
    const onFinish = vi.fn()
    render(<DerbyDuel rivalName="Huracán" onFinish={onFinish} rng={seeded()} />)
    answerAll('Plantarse')
    expect(screen.getByLabelText('Resultado del duelo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'A la cancha' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
    const { result, total } = onFinish.mock.calls[0][0]
    // Plantarse gana solo el juego mental (+1), empata el elogio (0) y cae en la provocación (-1): el total es 0
    expect(JAB_TYPES).toHaveLength(3)
    expect(total).toBe(0)
    expect(result).toBe('DRAW')
  })
})
