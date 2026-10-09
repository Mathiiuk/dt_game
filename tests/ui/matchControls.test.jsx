import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MatchControls from '../../src/features/match/MatchControls'
import { useMatchClock } from '../../src/features/match/useMatchClock'
import { msPerMinute } from '../../src/domain/matchClock'

describe('controles del partido', () => {
  const setup = (props = {}) => {
    const handlers = { onSpeed: vi.fn(), onTogglePause: vi.fn(), onSkip: vi.fn() }
    render(<MatchControls speed={1} paused={false} {...handlers} {...props} />)
    return handlers
  }

  it('ofrece pausa, dos velocidades y saltear como acción aparte', async () => {
    const h = setup()
    expect(screen.getByRole('button', { name: 'Pausa' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('radio', { name: 'x1' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'x2' })).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(screen.getByRole('radio', { name: 'x2' }))
    expect(h.onSpeed).toHaveBeenCalledWith(2)
    expect(screen.queryByRole('radio', { name: 'x4' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Saltear partido/ }))
    expect(h.onSkip).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('en pausa el botón pasa a reanudar', async () => {
    const h = setup({ paused: true })
    const resume = screen.getByRole('button', { name: 'Reanudar' })
    expect(resume).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(resume)
    expect(h.onTogglePause).toHaveBeenCalledTimes(1)
  })
})

// Cada minuto reprograma el temporizador después de renderizar: se avanza de a un minuto por vez
const run = (ms, step) => { for (let t = 0; t + step <= ms; t += step) act(() => { vi.advanceTimersByTime(step) }) }

describe('useMatchClock', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function Clock({ paused = false, speed = 1, start = 0, active = true, onTick }) {
    const [minute, setMinute] = React.useState(start)
    useMatchClock({ active, paused, minute, speed, onTick: (m) => { setMinute(m); onTick(m) } })
    return <p>Minuto {minute}</p>
  }

  it('avanza un minuto cada vez que pasa el tiempo de la velocidad elegida', () => {
    const onTick = vi.fn()
    render(<Clock onTick={onTick} speed={1} />)
    act(() => { vi.advanceTimersByTime(msPerMinute(1) - 1) })
    expect(onTick).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(1) })
    expect(onTick).toHaveBeenCalledWith(1)
    run(msPerMinute(1) * 2, msPerMinute(1))
    expect(onTick).toHaveBeenLastCalledWith(3)
  })

  it('x2 avanza más rápido que x1', () => {
    const slow = vi.fn()
    const fast = vi.fn()
    const { unmount } = render(<Clock onTick={slow} speed={1} />)
    run(msPerMinute(1) * 3, msPerMinute(1))
    unmount()
    render(<Clock onTick={fast} speed={2} />)
    run(msPerMinute(1) * 3, msPerMinute(2))
    expect(slow).toHaveBeenCalledTimes(3)
    expect(fast.mock.calls.length).toBeGreaterThan(slow.mock.calls.length * 3)
  })

  it('en pausa el reloj se detiene y al reanudar sigue desde el mismo minuto', () => {
    const onTick = vi.fn()
    const { rerender } = render(<Clock onTick={onTick} speed={2} start={30} paused />)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(onTick).not.toHaveBeenCalled()
    expect(screen.getByText('Minuto 30')).toBeInTheDocument()
    rerender(<Clock onTick={onTick} speed={2} start={30} paused={false} />)
    act(() => { vi.advanceTimersByTime(msPerMinute(2)) })
    expect(onTick).toHaveBeenCalledWith(31)
  })

  it('no pasa del minuto 90 ni corre fuera de juego', () => {
    const onTick = vi.fn()
    render(<Clock onTick={onTick} start={90} />)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(onTick).not.toHaveBeenCalled()
    const idle = vi.fn()
    render(<Clock onTick={idle} active={false} />)
    act(() => { vi.advanceTimersByTime(10000) })
    expect(idle).not.toHaveBeenCalled()
  })
})
