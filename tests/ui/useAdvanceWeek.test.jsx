import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useAdvanceWeek } from '../../src/features/week/useAdvanceWeek'
import { isBusy, resetBusy } from '../../src/lib/busy'

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }

describe('useAdvanceWeek', () => {
  beforeEach(() => { vi.useFakeTimers(); resetBusy() })
  afterEach(() => { vi.useRealTimers(); resetBusy() })

  it('si responde rápido no muestra nada y no queda ocupado', async () => {
    const { result } = renderHook(() => useAdvanceWeek())
    let out
    await act(async () => { out = await result.current.advance({ run: async () => ({ week: 3 }) }) })
    expect(out.shown).toBe(false)
    expect(out.result.week).toBe(3)
    expect(result.current.visible).toBe(false)
    expect(isBusy()).toBe(false)
  })

  it('si tarda aparece, rota las frases, marca ocupado y al terminar muestra el resumen', async () => {
    const d = deferred()
    const { result } = renderHook(() => useAdvanceWeek())
    let p
    act(() => { p = result.current.advance({ run: () => d.promise, readBudget: vi.fn().mockResolvedValueOnce(100).mockResolvedValueOnce(80) }) })
    expect(isBusy()).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(700) })
    expect(result.current.visible).toBe(true)
    const t0 = result.current.tick
    await act(async () => { await vi.advanceTimersByTimeAsync(1300) })
    expect(result.current.tick).toBeGreaterThan(t0)
    await act(async () => { d.resolve({ week: 4, stats: { injuriesRecovered: 1 } }); await vi.advanceTimersByTimeAsync(2000); await p })
    expect(result.current.summary.map(l => l.id)).toEqual(['week', 'money', 'medical'])
    expect(isBusy()).toBe(false)
    act(() => result.current.close())
    expect(result.current.visible).toBe(false)
  })

  it('si falla se cierra todo y el error llega a quien llamó', async () => {
    const d = deferred()
    const { result } = renderHook(() => useAdvanceWeek())
    let caught
    let p
    act(() => { p = result.current.advance({ run: () => d.promise }).catch(e => { caught = e }) })
    await act(async () => { await vi.advanceTimersByTimeAsync(700) })
    await act(async () => { d.reject(new Error('boom')); await p })
    expect(caught.message).toBe('boom')
    expect(result.current.visible).toBe(false)
    expect(isBusy()).toBe(false)
  })
})
