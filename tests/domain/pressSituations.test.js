import { toneHistory, memoryQuestion, situationQuestion } from '../../src/domain/pressSituations'

const TONES = ['PRAISING', 'COMBATIVE', 'SELF_CRITICAL', 'PRAGMATIC']
const rng = () => 0.1

const validQuestion = (q) => {
  expect(q.topic_category).toBeTruthy()
  expect(q.question_text.length).toBeGreaterThan(20)
  expect(q.options.map(o => o.tone).sort()).toEqual([...TONES].sort())
  for (const o of q.options) { expect(o.text && o.boardReaction).toBeTruthy(); expect(typeof o.moraleDelta).toBe('number') }
}

describe('historial de tonos', () => {
  it('toma los tonos elegidos de las últimas conferencias, de la más nueva a la más vieja, ignorando las sin respuesta', () => {
    const conferences = [
      { press_qa_items: [{ chosen_tone: 'COMBATIVE', order_index: 1 }, { chosen_tone: 'PRAISING', order_index: 2 }] },
      { press_qa_items: [{ chosen_tone: null, order_index: 1 }] },
      { press_qa_items: [{ chosen_tone: 'SELF_CRITICAL', order_index: 1 }] }
    ]
    expect(toneHistory(conferences)).toEqual(['COMBATIVE', 'PRAISING', 'SELF_CRITICAL'])
  })
  it('sin conferencias devuelve una lista vacía', () => {
    expect(toneHistory([])).toEqual([])
    expect(toneHistory(undefined)).toEqual([])
  })
})

describe('el periodista recuerda cómo contestaste', () => {
  it('tres respuestas combativas seguidas: le pregunta si no está peleado con todo el mundo', () => {
    const q = memoryQuestion(['COMBATIVE', 'COMBATIVE', 'COMBATIVE', 'PRAISING'], rng)
    validQuestion(q)
    expect(q.question_text).toMatch(/pelear|peleado|polémica/i)
  })
  it('tres autocríticas seguidas: le pregunta cuándo va a defender a sus jugadores', () => {
    const q = memoryQuestion(['SELF_CRITICAL', 'SELF_CRITICAL', 'SELF_CRITICAL'], rng)
    validQuestion(q)
    expect(q.question_text).toMatch(/defender|jugadores/i)
  })
  it('tres elogios seguidos: le pregunta si no se están acomodando', () => {
    const q = memoryQuestion(['PRAISING', 'PRAISING', 'PRAISING'], rng)
    validQuestion(q)
  })
  it('con respuestas variadas o con menos de tres no hay pregunta de memoria', () => {
    expect(memoryQuestion(['COMBATIVE', 'PRAISING', 'COMBATIVE'], rng)).toBeNull()
    expect(memoryQuestion(['COMBATIVE', 'COMBATIVE'], rng)).toBeNull()
    expect(memoryQuestion([], rng)).toBeNull()
  })
})

describe('pregunta por la situación', () => {
  it('una racha de derrotas manda: el periodista pregunta por el momento del equipo', () => {
    const q = situationQuestion({ lossStreak: 4 }, rng)
    validQuestion(q)
    expect(q.topic_category).toBe('BAD_RUN_CRISIS')
    expect(q.question_text).toMatch(/4/)
  })
  it('una racha de victorias también tiene su pregunta', () => {
    const q = situationQuestion({ winStreak: 3 }, rng)
    validQuestion(q)
    expect(q.question_text).toMatch(/3/)
  })
  it('un invicto largo (5 o más sin perder) tiene su pregunta', () => {
    expect(situationQuestion({ unbeaten: 6 }, rng).question_text).toMatch(/6/)
  })
  it('si el rival tiene a un ex jugador del club, se lo preguntan por su nombre', () => {
    const q = situationQuestion({ exPlayerName: 'Matías Ferreyra' }, rng)
    validQuestion(q)
    expect(q.question_text).toMatch(/Matías Ferreyra/)
    expect(q.topic_category).toBe('EX_PLAYER')
  })
  it('si la figura del partido es un refuerzo de esta temporada, preguntan por el fichaje', () => {
    const q = situationQuestion({ mvpSigningName: 'Julián Gómez' }, rng)
    validQuestion(q)
    expect(q.question_text).toMatch(/Julián Gómez/)
    expect(q.topic_category).toBe('NEW_SIGNING')
  })
  it('sin ninguna situación especial no hay pregunta', () => {
    expect(situationQuestion({}, rng)).toBeNull()
    expect(situationQuestion({ winStreak: 2, lossStreak: 1, unbeaten: 3 }, rng)).toBeNull()
  })
  it('con varias situaciones prioriza al ex jugador y después el refuerzo y después la racha', () => {
    expect(situationQuestion({ lossStreak: 4, exPlayerName: 'A B', mvpSigningName: 'C D' }, rng).topic_category).toBe('EX_PLAYER')
    expect(situationQuestion({ lossStreak: 4, mvpSigningName: 'C D' }, rng).topic_category).toBe('NEW_SIGNING')
  })
})
