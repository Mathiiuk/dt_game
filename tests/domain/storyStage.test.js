import { describe, it, expect } from 'vitest'
import { stageModeFor, canChoose, safestOption, randomOption, STAGE_MODES } from '../../src/domain/storyStage'

const options = [
  { id: 'A', label: 'Gastar', cost: 400, effects: { fans: 2 } },
  { id: 'B', label: 'Esperar', cost: 0, effects: {} },
  { id: 'C', label: 'Apostar', cost: 0, effects: { fans: 5, board: -4 } }
]

describe('escenario de historias', () => {
  it('cada capítulo tiene siempre el mismo modo de decisión', () => {
    const ev = { template_code: 'ARC_PIBE_1' }
    expect(stageModeFor(ev)).toBe(stageModeFor({ ...ev }))
    expect(STAGE_MODES).toContain(stageModeFor(ev))
  })

  it('no se puede elegir lo que no alcanza o no tiene respaldo', () => {
    expect(canChoose(options[0], { budget: 100 })).toBe(false)
    expect(canChoose(options[0], { budget: 500 })).toBe(true)
    expect(canChoose({ requires: { board: 60 } }, { boardConfidence: 40 })).toBe(false)
  })

  it('si se acaba el tiempo, el narrador elige lo gratis y de menor efecto', () => {
    expect(safestOption(options, { budget: 1000 }).id).toBe('B')
  })

  it('la moneda sólo cae en opciones disponibles', () => {
    for (let i = 0; i < 20; i++) expect(randomOption(options, { budget: 0 }, () => i / 20).cost).toBe(0)
  })
})
