import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { shareMoment } = vi.hoisted(() => ({ shareMoment: vi.fn() }))
vi.mock('../../src/lib/shareMatch', () => ({ shareMoment }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import ShareMomentButton from '../../src/components/ShareMomentButton'

describe('botón de compartir un momento', () => {
  beforeEach(() => { shareMoment.mockReset(); window.dataLayer = [] })

  it('arma la tarjeta del momento, la comparte y mide el evento', async () => {
    shareMoment.mockResolvedValue('shared')
    render(<ShareMomentButton label="Compartir el campeonato" moment={{ kind: 'champion', club: 'Potrero', season: 2027 }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Compartir el campeonato' }))
    expect(shareMoment).toHaveBeenCalledWith(expect.objectContaining({ kind: 'champion', headline: '¡CAMPEONES!', club: 'Potrero' }))
    expect(window.dataLayer).toContainEqual({ event: 'share_moment', placement: 'champion' })
  })
})
