// Minijuegos propios de cada tipo de evento: el cántico, calmar al vestuario, el titular y cuadrar la caja
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ChantChallenge, CalmChallenge, HeadlineChallenge, BalanceChallenge } from '../../src/features/dashboard/StoryCategoryGames'
import { challengeFor } from '../../src/domain/storyStage'
import StoryStage from '../../src/features/dashboard/StoryStage'

const advance = (ms) => act(() => { vi.advanceTimersByTime(ms) })

describe('el cántico (comunidad y barrio)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  // Con el azar en cero los golpes caen a 1100, 1750, 2400 y 3050 ms
  const BEATS = [1100, 1750, 2400, 3050]

  it('tocando justo en cada golpe se gana', () => {
    const onDone = vi.fn()
    render(<ChantChallenge onDone={onDone} />)
    let t = 0
    for (const at of BEATS) { advance(at - t); t = at; fireEvent.pointerDown(screen.getByRole('button', { name: 'Seguir el cántico' })) }
    expect(screen.getByRole('status')).toHaveTextContent('Aciertos: 4 de 4')
    advance(1500)
    expect(onDone).toHaveBeenCalledWith(true)
  })

  it('tocando a destiempo no suma y se pierde', () => {
    const onDone = vi.fn()
    render(<ChantChallenge onDone={onDone} />)
    for (let i = 0; i < 6; i++) { advance(150); fireEvent.pointerDown(screen.getByRole('button', { name: 'Seguir el cántico' })) }
    advance(5000)
    expect(onDone).toHaveBeenCalledWith(false)
  })

  it('un golpe no se puede cobrar dos veces', () => {
    render(<ChantChallenge onDone={vi.fn()} />)
    advance(1100)
    const circle = screen.getByRole('button', { name: 'Seguir el cántico' })
    fireEvent.pointerDown(circle)
    fireEvent.pointerDown(circle)
    expect(screen.getByRole('status')).toHaveTextContent('Aciertos: 1 de 4')
  })
})

describe('calmar al vestuario (vestuario)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  const play = (tapWhenAbove) => {
    for (let i = 0; i < 36; i++) {
      const tension = Number(screen.getByRole('meter', { name: 'Tensión del vestuario' }).getAttribute('aria-valuenow'))
      if (tension > tapWhenAbove) fireEvent.pointerDown(screen.getByRole('button', { name: /Calmar/ }))
      advance(250)
    }
    advance(800)
  }

  it('manteniendo la tensión en lo verde se gana', () => {
    const onDone = vi.fn()
    render(<CalmChallenge onDone={onDone} />)
    play(52)
    expect(onDone).toHaveBeenCalledWith(true)
  })

  it('sin tocar nunca la tensión se dispara y se pierde', () => {
    const onDone = vi.fn()
    render(<CalmChallenge onDone={onDone} />)
    play(1000)
    expect(onDone).toHaveBeenCalledWith(false)
  })

  it('muestra la tensión y el tiempo que queda', () => {
    render(<CalmChallenge onDone={vi.fn()} />)
    expect(screen.getByRole('meter', { name: 'Tensión del vestuario' })).toBeInTheDocument()
    expect(screen.getByText(/Quedan/)).toBeInTheDocument()
  })
})

describe('armá el titular (dirigencia y prensa)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  // Con el azar en cero el titular es "EL PIBE SALVÓ AL CLUB"
  it('tocando las palabras en orden se arma el titular y se gana', () => {
    const onDone = vi.fn()
    render(<HeadlineChallenge onDone={onDone} />)
    for (const w of ['EL', 'PIBE', 'SALVÓ', 'AL', 'CLUB']) fireEvent.click(screen.getByRole('button', { name: w }))
    expect(screen.getByText('EL PIBE SALVÓ AL CLUB')).toBeInTheDocument()
    advance(800)
    expect(onDone).toHaveBeenCalledWith(true)
  })

  it('un error se perdona y el segundo pierde', () => {
    const onDone = vi.fn()
    render(<HeadlineChallenge onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: 'CLUB' }))
    expect(screen.getByRole('status')).toHaveTextContent('Errores: 1 de 2')
    advance(800)
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'AL' }))
    advance(800)
    expect(onDone).toHaveBeenCalledWith(false)
  })

  it('una palabra ya puesta no se puede volver a tocar', () => {
    render(<HeadlineChallenge onDone={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'EL' }))
    expect(screen.getByRole('button', { name: 'EL' })).toBeDisabled()
  })
})

describe('cuadrar la caja (crisis de plata)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0) })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  // Con el azar en cero los cinco gastos son de $200 y hay que cubrir $400 (dos gastos)
  it('eligiendo los gastos que suman justo se gana', () => {
    const onDone = vi.fn()
    render(<BalanceChallenge onDone={onDone} />)
    const items = screen.getAllByRole('button', { pressed: false })
    fireEvent.click(items[0]); fireEvent.click(items[1])
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    expect(screen.getByText('¡La caja cierra!')).toBeInTheDocument()
    advance(800)
    expect(onDone).toHaveBeenCalledWith(true)
  })

  it('el primer error avisa cuánto falta y deja un segundo intento; el segundo pierde', () => {
    const onDone = vi.fn()
    render(<BalanceChallenge onDone={onDone} />)
    fireEvent.click(screen.getAllByRole('button', { pressed: false })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    expect(screen.getByText(/Te faltan .* Te queda un intento/)).toBeInTheDocument()
    expect(screen.getByText('Intento 2 de 2')).toBeInTheDocument()
    advance(800)
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.click(screen.getAllByRole('button', { pressed: false })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    advance(800)
    expect(onDone).toHaveBeenCalledWith(false)
  })

  it('sin elegir nada no se puede cerrar la caja', () => {
    render(<BalanceChallenge onDone={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Cerrar caja' })).toBeDisabled()
  })
})

describe('en la pantalla completa', () => {
  afterEach(() => vi.restoreAllMocks())

  const findEvent = (category, challenge) => {
    for (let i = 0; i < 500; i++) {
      const ev = { id: 'e1', template_code: `EVT_PRUEBA_${i}`, category, severity: 'LOW' }
      if (challengeFor(ev) === challenge) return ev
    }
    throw new Error('sin evento')
  }

  it.each([
    ['COMMUNITY', 'CHANT', 'El cántico de la tribuna'],
    ['LOCKER_ROOM', 'CALM', 'Calmar al vestuario'],
    ['BOARD_PRESS', 'HEADLINE', 'Armá el titular'],
    ['FINANCIAL_CRISIS', 'BALANCE', 'Cuadrar la caja']
  ])('un evento de %s propone su minijuego propio (%s)', (category, challenge, title) => {
    const base = findEvent(category, challenge)
    const event = { ...base, title: 'Algo pasó', description: 'Una frase corta.', options: [{ id: 'A', label: 'Hacer algo', effects: {}, cost: 0 }, { id: 'B', label: 'No hacer nada', effects: {}, cost: 0 }] }
    render(<StoryStage event={event} budget={1000} boardConfidence={80} result={null} busy={false} onChoose={vi.fn()} onLater={vi.fn()} onClose={vi.fn()} />)
    for (let i = 0; i < 5; i++) { const next = screen.queryByRole('button', { name: 'Seguir leyendo' }); if (!next) break; fireEvent.click(next) }
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jugar el desafío' })).toBeInTheDocument()
  })
})
