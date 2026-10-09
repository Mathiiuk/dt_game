import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import StoryStage from '../../src/features/dashboard/StoryStage'
import { stageModeFor, challengeFor } from '../../src/domain/storyStage'

const baseOptions = [
  { id: 'A', label: 'Traerlo ya', description: 'Una prueba y una cama.', effects: { fans: 2, locker: 1 }, cost: 400 },
  { id: 'B', label: 'Dejarlo madurar', description: 'Que crezca tranquilo.', effects: {}, cost: 0 }
]

// Busca un código de capítulo con el modo y el desafío que se quieren probar (el reparto es estable)
const findCode = (mode, challenge) => {
  for (let i = 0; i < 400; i++) {
    const ev = { template_code: `ARC_PIBE_${i}`, category: 'COMMUNITY' }
    if (stageModeFor(ev) === mode && challengeFor(ev) === challenge) return ev.template_code
  }
  throw new Error('sin combinación')
}

const makeEvent = (code) => ({
  id: 'ev1',
  template_code: code,
  category: 'COMMUNITY',
  title: 'Un pibe que la rompe (1/4)',
  description: 'Un ojeador te cuenta de un zurdo. "Pará, que se lo lleva un grande", te susurra.',
  options: baseOptions
})

const renderStage = (props = {}) => {
  const handlers = { onChoose: vi.fn(), onLater: vi.fn(), onClose: vi.fn() }
  render(<StoryStage event={makeEvent(findCode('HOLD', null))} budget={1000} boardConfidence={80} result={null} busy={false} {...handlers} {...props} />)
  return handlers
}

// Avanza la lectura hasta llegar a la decisión
const readAll = () => {
  for (let i = 0; i < 10; i++) {
    const next = screen.queryByRole('button', { name: 'Seguir leyendo' })
    if (!next) break
    fireEvent.click(next)
  }
}

describe('historia a pantalla completa', () => {
  it('se lee de a un momento y recién después aparecen las opciones', () => {
    renderStage()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('Traerlo ya')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Capítulo 1 de 4/)).toBeInTheDocument()
    readAll()
    expect(screen.getByText('Traerlo ya')).toBeInTheDocument()
    expect(screen.getByText('Dejarlo madurar')).toBeInTheDocument()
  })

  it('mantener apretado: sin elegir una opción no se puede confirmar, y con teclado se confirma lo elegido', () => {
    const { onChoose } = renderStage()
    readAll()
    const hold = screen.getByRole('button', { name: /Elegí una opción/ })
    expect(hold).toBeDisabled()
    fireEvent.click(screen.getByText('Dejarlo madurar'))
    const confirm = screen.getByRole('button', { name: /Mantené apretado/ })
    expect(confirm).not.toBeDisabled()
    fireEvent.keyDown(confirm, { key: 'Enter' })
    expect(onChoose).toHaveBeenCalledWith(expect.objectContaining({ id: 'B' }))
  })

  it('una opción que la caja no alcanza no se puede elegir', () => {
    renderStage({ budget: 100 })
    readAll()
    expect(screen.getByText('Traerlo ya').closest('button')).toBeDisabled()
  })

  it('"Decidir más tarde" y Esc dejan la historia pendiente', () => {
    const { onLater } = renderStage()
    readAll()
    fireEvent.click(screen.getByRole('button', { name: 'Decidir más tarde' }))
    expect(onLater).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onLater).toHaveBeenCalledTimes(2)
  })

  it('con el resultado muestra la cargada y los efectos, y "Seguir" cierra', () => {
    const { onClose } = renderStage({ result: { note: 'Quedó bien.', choice: 'Traerlo ya', effects: { fans: 2, budget: -400 }, reaction: 'La tribuna canta.' } })
    expect(screen.getByText('Quedó bien.')).toBeInTheDocument()
    expect(screen.getByText('La tribuna canta.')).toBeInTheDocument()
    const chips = screen.getByRole('list', { name: 'Lo que cambió' })
    expect(within(chips).getByText(/Hinchada \+2/)).toBeInTheDocument()
    expect(within(chips).getByText(/Caja -400/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Seguir/ }))
    expect(onClose).toHaveBeenCalled()
  })

  it('un capítulo con desafío lo propone antes de decidir y se puede saltear', () => {
    const code = findCode('HOLD', 'RUMOR')
    renderStage({ event: makeEvent(code) })
    readAll()
    expect(screen.getByRole('heading', { name: 'Verdadero o falso' })).toBeInTheDocument()
    expect(screen.queryByText('Traerlo ya')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Paso, decido a ciegas/ }))
    expect(screen.getByText('Traerlo ya')).toBeInTheDocument()
    // Sin pista no se ven los efectos de las opciones
    expect(screen.queryByText(/Hinchada \+2/)).not.toBeInTheDocument()
  })
})

describe('decisiones sueltas del club a pantalla completa', () => {
  const looseEvent = (extra = {}) => ({
    id: 'ev9',
    template_code: 'EVT_TRIBUNA_CANTA',
    category: 'COMMUNITY',
    severity: 'LOW',
    title: 'La tribuna te canta el nombre',
    description: 'Terminó el entrenamiento abierto y los hinchas empezaron a cantar. No es habitual. Hay chicos con la camiseta puesta esperando una foto.',
    options: baseOptions,
    ...extra
  })

  it('un evento común (sin capítulos) se lee de a poco con el nombre de su tipo en la cabecera', () => {
    render(<StoryStage event={looseEvent()} budget={1000} boardConfidence={80} result={null} busy={false} onChoose={vi.fn()} onLater={vi.fn()} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'La tribuna te canta el nombre' })
    expect(within(dialog).getByText('Comunidad y barrio')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText(/Capítulo/)).not.toBeInTheDocument()
    expect(screen.queryByText('Traerlo ya')).not.toBeInTheDocument()
    readAll()
    // Si le toca un desafío de pista se puede pasar y decidir a ciegas
    const skipClue = screen.queryByRole('button', { name: /Paso, decido a ciegas/ })
    if (skipClue) fireEvent.click(skipClue)
    expect(screen.getByText('Traerlo ya')).toBeInTheDocument()
  })

  it('un evento suelto se lee de un solo toque y una historia con capítulos se lee de a momentos', () => {
    const { unmount } = render(<StoryStage event={looseEvent()} budget={1000} boardConfidence={80} result={null} busy={false} onChoose={vi.fn()} onLater={vi.fn()} onClose={vi.fn()} />)
    // El evento suelto muestra todo el texto junto: un solo toque para seguir
    expect(screen.getByText(/Terminó el entrenamiento abierto.*camiseta puesta esperando una foto/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Seguir leyendo' }))
    expect(screen.queryByRole('button', { name: 'Seguir leyendo' })).not.toBeInTheDocument()
    unmount()
    // Una historia con capítulos se reparte en varios momentos
    render(<StoryStage event={{ ...makeEvent(findCode('HOLD', null)), description: 'Un ojeador te cuenta de un zurdo. "Pará, que se lo lleva un grande", te susurra. Mide uno sesenta.' }} budget={1000} boardConfidence={80} result={null} busy={false} onChoose={vi.fn()} onLater={vi.fn()} onClose={vi.fn()} />)
    let taps = 0
    while (screen.queryByRole('button', { name: 'Seguir leyendo' }) && taps < 10) { fireEvent.click(screen.getByRole('button', { name: 'Seguir leyendo' })); taps++ }
    expect(taps).toBeGreaterThan(1)
  })

  it('una decisión urgente lo avisa en la cabecera', () => {
    render(<StoryStage event={looseEvent({ severity: 'CRITICAL', category: 'LOCKER_ROOM', title: 'Pelea en el vestuario' })} budget={1000} boardConfidence={80} result={null} busy={false} onChoose={vi.fn()} onLater={vi.fn()} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Vestuario')).toBeInTheDocument()
    expect(within(dialog).getByText('Urgente')).toBeInTheDocument()
  })

  it('un evento de otro tipo no cae en "Historia": usa su categoría o "Decisión del DT"', () => {
    render(<StoryStage event={looseEvent({ category: 'OTRA' })} budget={1000} boardConfidence={80} result={null} busy={false} onChoose={vi.fn()} onLater={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Decisión del DT')).toBeInTheDocument()
  })
})
