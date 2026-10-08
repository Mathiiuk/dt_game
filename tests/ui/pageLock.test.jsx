import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { usePageLock } from '../../src/hooks/usePageLock'

function Probe({ active = true }) {
  usePageLock(active)
  return <p>pantalla</p>
}

describe('bloqueo de la página (iPhone)', () => {
  it('mientras la pantalla está montada la página no scrollea ni rebota, y al salir vuelve todo', () => {
    document.body.style.overflow = ''
    const { unmount } = render(<Probe />)
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.overscrollBehavior).toBe('none')
    unmount()
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
  })

  it('apagado no toca nada', () => {
    render(<Probe active={false} />)
    expect(document.documentElement.style.overflow).toBe('')
  })
})
