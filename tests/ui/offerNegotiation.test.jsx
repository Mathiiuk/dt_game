// Negociación del fichaje: contraofertas de hasta dos rondas, pago en cuotas y cierre de la mesa
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OfferModal from '../../src/features/market/OfferModal'

window.matchMedia = (query) => ({
  matches: query.includes('min-width: 768px'), media: query,
  addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false
})

const player = { id: 'p1', first_name: 'Álvaro', last_name: 'Medina', position: 'MC', asking_price: 5000, market_value: 4500, clubs: { name: 'Racing' } }

const setup = (replies, props = {}) => {
  const queue = [...replies]
  const onSubmit = vi.fn(async () => queue.shift())
  const onClose = vi.fn()
  render(<OfferModal player={player} budget={20000} onSubmit={onSubmit} onClose={onClose} {...props} />)
  const dlg = screen.getByRole('dialog', { name: 'Álvaro Medina' })
  return { onSubmit, onClose, dlg }
}

const setAmount = async (dlg, value, label = 'Monto de la oferta') => {
  const field = within(dlg).getByLabelText(label)
  await userEvent.clear(field)
  await userEvent.type(field, String(value))
}

describe('negociación del fichaje', () => {
  it('arranca con el precio pedido y ofrece de contado o en cuotas', () => {
    const { dlg } = setup([])
    expect(within(dlg).getByLabelText('Monto de la oferta')).toHaveValue(5000)
    expect(within(dlg).getByRole('radio', { name: 'De contado' })).toHaveAttribute('aria-checked', 'true')
    expect(within(dlg).getByRole('radio', { name: /3 cuotas/ })).toBeInTheDocument()
  })

  it('contraoferta en la primera ronda: se puede aceptar y cierra el acuerdo', async () => {
    const { dlg, onSubmit } = setup([
      { status: 'COUNTER', round: 1, counter: 4800, final: false, installments: 1 },
      { status: 'ACCEPTED', price: 4800, upfront: 4800, installments: 1 }
    ])
    await setAmount(dlg, 4000)
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    expect(onSubmit).toHaveBeenLastCalledWith(4000, 1)
    expect(await within(dlg).findByText(/Ronda 1 de 2/)).toBeInTheDocument()
    expect(within(dlg).getByText(/subir tu oferta una vez más/)).toBeInTheDocument()

    await userEvent.click(within(dlg).getByRole('button', { name: /Aceptar/ }))
    expect(onSubmit).toHaveBeenLastCalledWith(4800, 1)
    expect(await within(dlg).findByText('¡Acuerdo cerrado!')).toBeInTheDocument()
  })

  it('se puede mejorar la oferta una vez más; la contraoferta de la segunda ronda es final y ya no se negocia', async () => {
    const { dlg, onSubmit } = setup([
      { status: 'COUNTER', round: 1, counter: 4800, final: false, installments: 1 },
      { status: 'COUNTER', round: 2, counter: 4600, final: true, installments: 1 }
    ])
    await setAmount(dlg, 4000)
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    await setAmount(dlg, 4400, 'Mejorar mi oferta')
    await userEvent.click(await within(dlg).findByRole('button', { name: /Enviar nueva oferta/ }))
    expect(onSubmit).toHaveBeenLastCalledWith(4400, 1)
    expect(await within(dlg).findByText(/Ronda 2 de 2/)).toBeInTheDocument()
    expect(within(dlg).getByText(/última oferta/)).toBeInTheDocument()
    expect(within(dlg).queryByLabelText('Mejorar mi oferta')).toBeNull()
    expect(within(dlg).queryByRole('button', { name: /Enviar nueva oferta/ })).toBeNull()
  })

  it('retirarse cierra el panel sin mandar nada más', async () => {
    const { dlg, onSubmit, onClose } = setup([{ status: 'COUNTER', round: 1, counter: 4800, final: false, installments: 1 }])
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    await userEvent.click(await within(dlg).findByRole('button', { name: 'Retirarme' }))
    expect(onClose).toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('una oferta ofensiva cierra la mesa hasta la próxima ventana', async () => {
    const { dlg } = setup([{ status: 'REJECTED', round: 1, message: 'La oferta fue una ofensa: se levantaron de la mesa.' }])
    await setAmount(dlg, 500)
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    expect(await within(dlg).findByText('Negociación cerrada')).toBeInTheDocument()
    expect(within(dlg).getByText(/próxima ventana de pases/)).toBeInTheDocument()
  })

  it('en 3 cuotas sube el precio 8%, explica el plan y solo exige el 40% en la caja', async () => {
    const { dlg, onSubmit } = setup([{ status: 'ACCEPTED', price: 5400, upfront: 2160, installments: 3 }], { budget: 2500 })
    await userEvent.click(within(dlg).getByRole('radio', { name: /3 cuotas/ }))
    expect(within(dlg).getByLabelText('Monto de la oferta')).toHaveValue(5400)
    expect(within(dlg).getByText(/Hoy pagás \$\s?2\.160/)).toBeInTheDocument()
    expect(within(dlg).getByText(/dos cuotas de/)).toBeInTheDocument()
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    expect(onSubmit).toHaveBeenCalledWith(5400, 3)
    expect(await within(dlg).findByText(/el resto va en dos cuotas/)).toBeInTheDocument()
  })

  it('de contado no se puede ofertar más de lo que hay en la caja', async () => {
    const { dlg, onSubmit } = setup([], { budget: 2500 })
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    expect(await within(dlg).findByRole('alert')).toHaveTextContent(/presupuesto suficiente/)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('si el DT desiste del aviso previo (la respuesta es nula) la mesa queda como estaba', async () => {
    const { dlg } = setup([null])
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    expect(within(dlg).getByLabelText('Monto de la oferta')).toBeInTheDocument()
  })

  it('muestra el sueldo que cobraría y cómo queda la masa salarial', () => {
    const { dlg } = setup([], { wageInfo: { newWage: 122, payroll: 2500, budget: 3500 } })
    const info = within(dlg).getByTestId('wage-info')
    expect(info).toHaveTextContent(/cobra \$\s?122 por semana/)
    expect(info).toHaveTextContent(/queda?ría en \$\s?2\.622 de \$\s?3\.500/)
  })

  it('avisa cuando el sueldo te pasa del presupuesto salarial', () => {
    const { dlg } = setup([], { wageInfo: { newWage: 400, payroll: 3300, budget: 3500 } })
    expect(within(dlg).getByTestId('wage-info')).toHaveTextContent(/te pasás del presupuesto/)
  })

  it('sin datos de la masa salarial no muestra nada', () => {
    const { dlg } = setup([])
    expect(within(dlg).queryByTestId('wage-info')).toBeNull()
  })

  it('al cerrar el acuerdo muestra la comisión del representante', async () => {
    const { dlg } = setup([{ status: 'ACCEPTED', price: 5000, upfront: 5000, installments: 1, commission: 720, commission_rate: 0.144 }])
    await userEvent.click(within(dlg).getByRole('button', { name: /Enviar oferta/ }))
    expect(await within(dlg).findByText(/Comisión del representante: \$\s?720 \(14[.,]4%\)/)).toBeInTheDocument()
  })
})

