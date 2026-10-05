import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

const confirmAction = vi.fn(async () => true)
const skipConference = vi.fn(async () => ({ kind: 'RUMOR', fine: 400, fans: -3, board: -3, message: 'Sin tu voz, la prensa llenó el vacío.', outcome: 'L' }))

vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ confirmAction })
}))

vi.mock('../../src/api/postMatch', () => ({
  postMatchApi: { processResult: vi.fn(async () => ({ playerRatings: [], mvp: null, attendance: 900, netIncome: 4000 })) }
}))

vi.mock('../../src/api/press', () => ({
  pressApi: {
    generatePostMatchConference: vi.fn(async () => ({
      conference: { id: 'k1', status: 'IN_PROGRESS' },
      questions: [{
        id: 'q1', order_index: 0, media_outlet: 'Radio del Barrio', journalist_name: 'Pepe', question_text: '¿Qué pasó hoy?',
        options: [{ tone: 'SELF_CRITICAL', text: 'Asumo la derrota.', moraleDelta: 2 }]
      }]
    })),
    submitAnswer: vi.fn(async () => ({ isFinished: true })),
    delegateToAssistant: vi.fn(async () => ({})),
    skipConference: (...a) => skipConference(...a)
  }
}))

import PostMatchScreen from '../../src/features/match/PostMatchScreen'

const results = { isHome: true, homeScore: 0, awayScore: 2, opponentName: 'Rival', events: [], stats: {} }

const renderScreen = () => render(
  <MemoryRouter initialEntries={[{ pathname: '/post-match', state: { results, managerId: 'm1', clubId: 'c1', clubName: 'Potrero', fixtureId: 'f1' } }]}>
    <Routes>
      <Route path="/post-match" element={<PostMatchScreen />} />
      <Route path="/dashboard" element={<p>Pantalla de inicio</p>} />
    </Routes>
  </MemoryRouter>
)

const openPress = async () => {
  renderScreen()
  await userEvent.click(await screen.findByRole('button', { name: /Rueda de prensa/ }))
}

describe('rueda de prensa después del partido', () => {
  beforeEach(() => { confirmAction.mockClear(); skipConference.mockClear(); confirmAction.mockResolvedValue(true) })

  it('se puede omitir: avisa la multa, la cobra y muestra lo que pasó', async () => {
    await openPress()
    await userEvent.click(await screen.findByRole('button', { name: /No presentarme/ }))

    expect(confirmAction).toHaveBeenCalledTimes(1)
    expect(confirmAction.mock.calls[0][0].description).toMatch(/multar/)
    await waitFor(() => expect(skipConference).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Sin tu voz, la prensa llenó el vacío.')).toBeInTheDocument()
    expect(screen.getByText(/Multa:/)).toBeInTheDocument()
  })

  it('si cancelás el aviso, no pasa nada', async () => {
    confirmAction.mockResolvedValue(false)
    await openPress()
    await userEvent.click(await screen.findByRole('button', { name: /No presentarme/ }))
    expect(skipConference).not.toHaveBeenCalled()
    expect(screen.getByText(/¿Qué pasó hoy?/)).toBeInTheDocument()
  })

  it('irse sin hablar cuenta como no presentarse (con aviso previo)', async () => {
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: /Volver al inicio/ }))
    expect(confirmAction).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(skipConference).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('irse sin hablar y cancelar el aviso te deja en la pantalla', async () => {
    confirmAction.mockResolvedValue(false)
    renderScreen()
    await userEvent.click(await screen.findByRole('button', { name: /Volver al inicio/ }))
    expect(skipConference).not.toHaveBeenCalled()
    expect(screen.queryByText('Pantalla de inicio')).not.toBeInTheDocument()
  })
})
