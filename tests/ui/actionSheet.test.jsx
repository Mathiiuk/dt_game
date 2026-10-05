import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActionSheet from '../../src/components/ActionSheet'

describe('ActionSheet (confirmaciones)', () => {
  const config = { title: 'Despedir a Marcelo', description: 'Se abonarán 8 semanas de sueldo.', confirmText: 'Abonar finiquito', cancelText: 'Cancelar', variant: 'danger' }

  it('no muestra nada cerrado o sin configuración', () => {
    const { container, rerender } = render(<ActionSheet isOpen={false} config={config} onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(<ActionSheet isOpen config={null} onConfirm={() => {}} onCancel={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra título y descripción accesibles y confirma / cancela', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ActionSheet isOpen config={config} onConfirm={onConfirm} onCancel={onCancel} />)
    const dlg = screen.getByRole('dialog', { name: 'Despedir a Marcelo' })
    expect(dlg).toHaveAccessibleDescription('Se abonarán 8 semanas de sueldo.')
    await userEvent.click(screen.getByRole('button', { name: 'Abonar finiquito' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Esc equivale a cancelar', async () => {
    const onCancel = vi.fn()
    render(<ActionSheet isOpen config={config} onConfirm={() => {}} onCancel={onCancel} />)
    await userEvent.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalled()
  })

  it('acepta las variantes heredadas (emerald, amber...) y usa textos por defecto', () => {
    render(<ActionSheet isOpen config={{ variant: 'emerald' }} onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('dialog', { name: '¿Confirmar acción?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })
})
