import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PressRoom from '../../src/features/match/PressRoom'

// B15: no presentarse y delegar solo antes de la primera respuesta; después, "Terminar acá"
const option = { tone: 'PRAGMATIC', text: 'Partido a partido.', moraleDelta: 0 }
const question = (id, chosen) => ({ id, media_outlet: 'Radio del Barrio', journalist_name: 'Pepe', question_text: `Pregunta ${id}`, options: [option], chosen_tone: chosen || null, manager_answer_text: chosen ? 'Ya contesté.' : null })

const renderRoom = (props) => render(
  <PressRoom outcome="L" finished={false} delegated={false} skipResult={null} conferenceId="k1" onAnswer={vi.fn()} onNext={vi.fn()} onSkip={vi.fn()} onDelegate={vi.fn()} onFinishEarly={vi.fn()} onPhrase={vi.fn()} {...props} />
)

describe('sala de prensa: delegar y faltar solo antes de contestar', () => {
  beforeEach(() => { localStorage.setItem('press_no_timer', '1') })

  it('antes de la primera respuesta se puede faltar o delegar', () => {
    renderRoom({ questions: [question('q1'), question('q2')], currentIndex: 0 })
    expect(screen.getByRole('button', { name: /No presentarme/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delegar/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Terminar acá/ })).not.toBeInTheDocument()
  })

  it('después de contestar ya no se puede faltar ni delegar: queda "Terminar acá"', async () => {
    const onFinishEarly = vi.fn(async () => true)
    renderRoom({ questions: [question('q1', 'COMBATIVE'), question('q2')], currentIndex: 1, onFinishEarly })
    expect(screen.queryByRole('button', { name: /No presentarme/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delegar/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Terminar acá/ }))
    expect(onFinishEarly).toHaveBeenCalledTimes(1)
  })

  it('al terminar antes, el resumen muestra solo lo que contestaste', () => {
    renderRoom({ questions: [question('q1', 'COMBATIVE'), question('q2')], currentIndex: 1, finished: true })
    expect(screen.getByText(/Pregunta q1/)).toBeInTheDocument()
    expect(screen.queryByText(/Pregunta q2/)).not.toBeInTheDocument()
  })
})
