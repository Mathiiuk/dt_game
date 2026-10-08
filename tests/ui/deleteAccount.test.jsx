import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({ deleteAccount: vi.fn(), hardRedirect: vi.fn() }))
vi.mock('../../src/api/auth', () => ({ authApi: { deleteAccount: mocks.deleteAccount } }))
vi.mock('../../src/lib/redirect', () => ({ hardRedirect: mocks.hardRedirect }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import DeleteAccountDialog from '../../src/components/layout/DeleteAccountDialog'

describe('eliminar la cuenta', () => {
  beforeEach(() => { mocks.deleteAccount.mockReset(); mocks.hardRedirect.mockReset() })

  const open = (props = {}) => render(<DeleteAccountDialog open onClose={vi.fn()} {...props} />)

  it('explica qué se borra y no deja eliminar hasta escribir ELIMINAR', () => {
    open()
    expect(screen.getByText(/toda tu carrera/)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /Eliminar todo/ })
    expect(button).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Confirmación'), { target: { value: 'eliminar' } })
    expect(button).not.toBeDisabled()
    fireEvent.change(screen.getByLabelText('Confirmación'), { target: { value: 'borrar' } })
    expect(button).toBeDisabled()
  })

  it('al confirmar elimina la cuenta y vuelve a la portada', async () => {
    mocks.deleteAccount.mockResolvedValue({ ok: true })
    open()
    fireEvent.change(screen.getByLabelText('Confirmación'), { target: { value: 'ELIMINAR' } })
    fireEvent.click(screen.getByRole('button', { name: /Eliminar todo/ }))
    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalledWith('ELIMINAR'))
    await waitFor(() => expect(mocks.hardRedirect).toHaveBeenCalledWith('/'))
  })

  it('si falla no sale de la pantalla y se puede volver a intentar', async () => {
    mocks.deleteAccount.mockRejectedValue(new Error('No pudimos borrar tus datos'))
    open()
    fireEvent.change(screen.getByLabelText('Confirmación'), { target: { value: 'ELIMINAR' } })
    fireEvent.click(screen.getByRole('button', { name: /Eliminar todo/ }))
    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalledTimes(1))
    expect(mocks.hardRedirect).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: /Eliminar todo/ })).not.toBeDisabled())
  })

  it('cancelar cierra sin borrar nada', () => {
    const onClose = vi.fn()
    open({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
    expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })
})
