import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../src/api/supabase', () => ({ supabase: {} }))
vi.mock('../../src/context/GameContext', () => ({
  useGameContext: () => ({ confirmAction: vi.fn(async () => true), refreshContext: vi.fn(async () => {}) })
}))
vi.mock('../../src/api/postMatch', () => ({
  postMatchApi: { processResult: vi.fn(async () => ({ playerRatings: [], mvp: null, attendance: 900, netIncome: 4000 })) }
}))

// La base guarda 3 preguntas; la sala solo hace 2
const opts = [{ tone: 'PRAISING', text: 'Bien.', moraleDelta: 1 }]
vi.mock('../../src/api/press', () => ({
  pressApi: {
    generatePostMatchConference: vi.fn(async () => ({
      conference: { id: 'k1', status: 'IN_PROGRESS' },
      questions: [
        { id: 'q1', order_index: 1, media_outlet: 'Radio', journalist_name: 'Pepe', question_text: 'Uno', options: opts, chosen_tone: 'PRAISING', manager_answer_text: 'Bien.' },
        { id: 'q2', order_index: 2, media_outlet: 'Radio', journalist_name: 'Pepe', question_text: 'Dos', options: opts, chosen_tone: null },
        { id: 'q3', order_index: 3, media_outlet: 'Radio', journalist_name: 'Pepe', question_text: 'Tres', options: opts, chosen_tone: null }
      ]
    })),
    submitAnswer: vi.fn(async () => ({ isFinished: false })), delegateToAssistant: vi.fn(), skipConference: vi.fn(), finishEarly: vi.fn(),
    getBingo: vi.fn(async () => null)
  }
}))

import PostMatchScreen from '../../src/features/match/PostMatchScreen'

const results = { isHome: false, homeScore: 0, awayScore: 2, opponentName: 'Rival', events: [], stats: {} }

describe('rueda de prensa con más preguntas guardadas que las que se hacen', () => {
  it('no queda vacía después de la 2ª respuesta', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/post-match', state: { results, managerId: 'm1', clubId: 'c1', clubName: 'Potrero', fixtureId: 'f1' } }]}>
        <Routes><Route path="/post-match" element={<PostMatchScreen />} /></Routes>
      </MemoryRouter>
    )
    await userEvent.click(await screen.findByRole('button', { name: /Continuar a la rueda de prensa/ }))
    // Responde la 2ª y última pregunta de la sala y sigue: no hay 3ª
    await userEvent.click(await screen.findByRole('button', { name: /Bien\./ }))
    await userEvent.click(await screen.findByRole('button', { name: /Siguiente|Terminar|Seguir|Continuar/ }))
    expect(screen.queryByText(/Sin preguntas de prensa/)).not.toBeInTheDocument()
  })
})
