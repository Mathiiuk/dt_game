import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { RumorChallenge, TapsChallenge, TargetPick } from '../../src/features/dashboard/StoryMinigames'
import { ReflexChallenge, BillsChallenge } from '../../src/features/dashboard/StoryActionGames'
import { RUMORS, TAP_GOAL } from '../../src/domain/storyStage'

afterEach(() => vi.useRealTimers())

describe('minijuegos de las historias', () => {
  it('verdadero o falso: con todo bien se gana', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<RumorChallenge onDone={onDone} />)
    for (let i = 0; i < 3; i++) {
      const statement = screen.getByText(/\.$/, { selector: 'p.animate-rise-in' }).textContent
      const ok = RUMORS.find(r => r.text === statement).ok
      fireEvent.click(screen.getByRole('button', { name: ok ? /Verdadero/ : /Falso/ }))
      act(() => { vi.advanceTimersByTime(900) })
    }
    expect(onDone).toHaveBeenCalledWith(true)
  })

  it('verdadero o falso: con todo mal se pierde, sin consecuencias', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<RumorChallenge onDone={onDone} />)
    for (let i = 0; i < 3; i++) {
      const statement = screen.getByText(/\.$/, { selector: 'p.animate-rise-in' }).textContent
      const ok = RUMORS.find(r => r.text === statement).ok
      fireEvent.click(screen.getByRole('button', { name: ok ? /Falso/ : /Verdadero/ }))
      act(() => { vi.advanceTimersByTime(900) })
    }
    expect(onDone).toHaveBeenCalledWith(false)
  })

  it('insistencia: tocando la cantidad pedida se gana', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<TapsChallenge onDone={onDone} />)
    const button = screen.getByRole('button', { name: 'Insistir' })
    for (let i = 0; i < TAP_GOAL; i++) fireEvent.pointerDown(button)
    act(() => { vi.advanceTimersByTime(500) })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(true)
  })

  it('insistencia: si se acaba el tiempo sin llegar, se pierde una sola vez', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<TapsChallenge onDone={onDone} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Insistir' }))
    act(() => { vi.advanceTimersByTime(7000) })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(false)
  })

  it('reflejos: sin tocar nada se pierde al terminar las noticias', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<ReflexChallenge onDone={onDone} />)
    act(() => { vi.advanceTimersByTime(15000) })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(false)
  })

  it('puntería: una opción que no se puede elegir no se toma', () => {
    vi.useFakeTimers()
    const onPick = vi.fn()
    const options = [{ id: 'A' }, { id: 'B' }]
    // En pruebas no hay medidas de pantalla: la barra cuenta como centrada y cae en la segunda zona
    render(<TargetPick options={options} enabled={[true, false]} busy={false} onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Frenar la barra' }))
    act(() => { vi.advanceTimersByTime(1000) })
    expect(onPick).not.toHaveBeenCalled()
    expect(screen.getByText(/no se puede elegir/)).toBeInTheDocument()
  })

  it('puntería: una opción disponible se toma tras un instante', () => {
    vi.useFakeTimers()
    const onPick = vi.fn()
    render(<TargetPick options={[{ id: 'A' }, { id: 'B' }]} enabled={[true, true]} busy={false} onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Frenar la barra' }))
    act(() => { vi.advanceTimersByTime(800) })
    expect(onPick).toHaveBeenCalledWith({ id: 'B' })
  })

  it('billetes: si se acaba el tiempo sin juntar los suficientes, se pierde una sola vez', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    render(<BillsChallenge onDone={onDone} />)
    act(() => { vi.advanceTimersByTime(12000) })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(false)
  })
})
