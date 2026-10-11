import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import WhatsNew from '../../src/features/whatsnew/WhatsNew'
import { CHANGELOG, newestId } from '../../src/data/changelog'
import { resetBusy, markBusy } from '../../src/lib/busy'

const oldUser = { id: 'u1', created_at: '2026-01-01T00:00:00Z' }
const newUser = { id: 'u2', created_at: '2026-10-12T10:00:00Z' }
const KEY = (id) => `vestuario-changelog-seen:${id}`

describe('novedades tras actualizar', () => {
  beforeEach(() => { window.localStorage.clear(); resetBusy() })

  it('una cuenta con historia ve lo nuevo una vez y al cerrar no vuelve a salir', () => {
    const { unmount } = render(<WhatsNew user={oldUser} pathname="/dashboard" />)
    expect(screen.getByText('Novedades del juego')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: CHANGELOG[0].title })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(window.localStorage.getItem(KEY('u1'))).toBe(newestId())
    expect(screen.queryByText('Novedades del juego')).not.toBeInTheDocument()
    unmount()
    render(<WhatsNew user={oldUser} pathname="/dashboard" />)
    expect(screen.queryByText('Novedades del juego')).not.toBeInTheDocument()
  })

  it('solo muestra lo que falta: si ya vio la anterior, sale solo la nueva', () => {
    window.localStorage.setItem(KEY('u1'), CHANGELOG[1].id)
    render(<WhatsNew user={oldUser} pathname="/dashboard" />)
    expect(screen.getAllByRole('region')).toHaveLength(1)
  })

  it('una cuenta nueva arranca al día: no ve el historial', () => {
    render(<WhatsNew user={newUser} pathname="/dashboard" />)
    expect(screen.queryByText('Novedades del juego')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(KEY('u2'))).toBe(newestId())
  })

  it('no aparece en un partido ni con algo a medias', () => {
    const { rerender } = render(<WhatsNew user={oldUser} pathname="/post-match" />)
    expect(screen.queryByText('Novedades del juego')).not.toBeInTheDocument()
    markBusy('tactics-unsaved')
    rerender(<WhatsNew user={oldUser} pathname="/tactics" />)
    expect(screen.queryByText('Novedades del juego')).not.toBeInTheDocument()
  })

  it('sin usuario no hace nada', () => {
    render(<WhatsNew user={null} pathname="/dashboard" />)
    expect(screen.queryByText('Novedades del juego')).not.toBeInTheDocument()
  })
})
