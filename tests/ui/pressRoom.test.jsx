// Sala de prensa: cuenta regresiva, reacción de la sala y ronda de "Completá la frase"
import React from 'react'
import { render, screen, act, fireEvent } from '@testing-library/react'
import PressRoom from '../../src/features/match/PressRoom'

const options = [
  { tone: 'COMBATIVE', text: 'Les voy a decir cuatro cosas.', moraleDelta: 1 },
  { tone: 'PRAGMATIC', text: 'Partido a partido.', moraleDelta: 0 }
]
const questions = [
  { id: 'q1', media_outlet: 'Radio del Barrio', journalist_name: 'Pepe', question_text: '¿Qué pasó hoy?', options },
  { id: 'q2', media_outlet: 'Diario', journalist_name: 'Ana', question_text: '¿Y el árbitro?', options }
]

const setup = (props = {}) => {
  const handlers = {
    onAnswer: vi.fn(async () => {}),
    onNext: vi.fn(),
    onSkip: vi.fn(),
    onDelegate: vi.fn(),
    onPhrase: vi.fn(async () => null),
    onHeadline: vi.fn(async () => {})
  }
  render(<PressRoom questions={questions} currentIndex={0} outcome="L" finished={false} delegated={false} skipResult={null} conferenceId="k1" {...handlers} {...props} />)
  return handlers
}

const click = (el) => act(async () => { fireEvent.click(el) })
const seconds = (n) => { for (let i = 0; i < n; i++) act(() => { vi.advanceTimersByTime(1000) }) }

describe('sala de prensa relámpago', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
  afterEach(() => vi.useRealTimers())

  it('muestra la cuenta regresiva y al responder la sala reacciona antes de seguir', async () => {
    const h = setup()
    expect(screen.getByRole('timer')).toBeInTheDocument()
    await click(screen.getByRole('button', { name: /Partido a partido/ }))
    expect(h.onAnswer).toHaveBeenCalledWith(questions[0], options[1], { timedOut: false })
    expect(screen.getByText('Reacción de la sala')).toBeInTheDocument()
    await click(screen.getByRole('button', { name: /Siguiente pregunta/ }))
    expect(h.onNext).toHaveBeenCalledTimes(1)
  })

  it('al acabarse el tiempo responde solo con la opción cautelosa y avisa que fue nervioso', async () => {
    vi.useFakeTimers()
    const h = setup()
    seconds(12)
    await act(async () => {})
    expect(h.onAnswer).toHaveBeenCalledWith(questions[0], options[1], { timedOut: true })
    expect(screen.getByText(/Se te acabó el tiempo/)).toBeInTheDocument()
  })

  it('con "Sin cuenta regresiva" no hay temporizador ni respuesta automática, y queda guardado', async () => {
    vi.useFakeTimers()
    const h = setup()
    await act(async () => { fireEvent.click(screen.getByRole('checkbox', { name: /Sin cuenta regresiva/ })) })
    expect(screen.queryByRole('timer')).toBeNull()
    seconds(30)
    expect(h.onAnswer).not.toHaveBeenCalled()
    expect(localStorage.getItem('press_no_timer')).toBe('1')
  })

  it('la última pregunta ofrece terminar la conferencia', async () => {
    setup({ currentIndex: 1 })
    await click(screen.getByRole('button', { name: /Partido a partido/ }))
    expect(screen.getByRole('button', { name: /Terminar la conferencia/ })).toBeInTheDocument()
  })

  it('al terminar aparece "Completá la frase": se elige una vez y se aplica el efecto', async () => {
    const h = setup({ finished: true, questions: questions.map(q => ({ ...q, chosen_tone: 'PRAGMATIC', manager_answer_text: 'Partido a partido.' })) })
    expect(screen.getByRole('region', { name: 'Completá la frase del DT' })).toBeInTheDocument()
    const choices = screen.getAllByRole('button').filter(b => b.closest('section'))
    await click(choices[0])
    expect(h.onPhrase).toHaveBeenCalledTimes(1)
    expect(h.onPhrase.mock.calls[0][0]).toHaveProperty('fans')
    expect(screen.queryByRole('region', { name: 'Completá la frase del DT' })).toBeNull()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('si ya jugaste la frase de esta conferencia no se vuelve a ofrecer', () => {
    sessionStorage.setItem('press_phrase_k1', '1')
    setup({ finished: true })
    expect(screen.queryByRole('region', { name: 'Completá la frase del DT' })).toBeNull()
  })

  it('permite no presentarse o delegar mientras no respondiste', async () => {
    const h = setup()
    await click(screen.getByRole('button', { name: /No presentarme/ }))
    await click(screen.getByRole('button', { name: /Delegar/ }))
    expect(h.onSkip).toHaveBeenCalledTimes(1)
    expect(h.onDelegate).toHaveBeenCalledTimes(1)
  })

  it('Titular o fake: se marca una vez y se informa el efecto', async () => {
    const h = setup({ finished: true, headlineContext: { clubName: 'Potrero', rivalName: 'Racing', isHome: true, homeScore: 2, awayScore: 1, mvpName: null } })
    const section = screen.getByRole('region', { name: 'Titular o fake' })
    const buttons = section.querySelectorAll('button')
    expect(buttons).toHaveLength(3)
    await click(buttons[0])
    expect(h.onHeadline).toHaveBeenCalledTimes(1)
    expect(h.onHeadline.mock.calls[0][0]).toHaveProperty('correct')
    expect(screen.queryByRole('region', { name: 'Titular o fake' })).toBeNull()
  })

  it('si ya jugaste el titular de esta conferencia no se vuelve a ofrecer', () => {
    sessionStorage.setItem('press_headline_k1', '1')
    setup({ finished: true, headlineContext: { clubName: 'Potrero', rivalName: 'Racing', isHome: true, homeScore: 0, awayScore: 0 } })
    expect(screen.queryByRole('region', { name: 'Titular o fake' })).toBeNull()
  })

  it('el Bingo muestra la cartilla con los clichés tachados', () => {
    setup({ finished: true, bingo: { card: ['W1', 'W2', 'W3', 'D1', 'D2', 'D3', 'L1', 'L2', 'L3'], marks: ['W1'], lines: 0 } })
    const card = screen.getByRole('region', { name: 'Bingo del DT' })
    expect(card).toHaveTextContent('1 de 9')
    expect(card.querySelectorAll('li')).toHaveLength(9)
    expect(card.querySelector('li[aria-label$="(tachado)"]')).not.toBeNull()
  })

  it('la frase de manual tacha su cliché y avisa la línea completada', async () => {
    const card = ['W1', 'W2', 'W3', 'D1', 'D2', 'D3', 'L1', 'L2', 'L3']
    const h = setup({
      finished: true, outcome: 'W', bingo: { card, marks: ['W2', 'W3'], lines: 0 },
      onPhrase: vi.fn(async () => ({ card, marks: ['W2', 'W3', 'W1'], lines: 1, newLines: 1, full: false }))
    })
    const section = screen.getByRole('region', { name: 'Completá la frase del DT' })
    for (const b of section.querySelectorAll('button')) {
      if (/seguir trabajando|partido a partido|muy parejo|entienden lo que les pido/.test(b.textContent)) { await click(b); break }
    }
    expect(h).toBeTruthy()
    expect(await screen.findByText(/Línea! Completaste una línea/)).toBeInTheDocument()
  })
})

