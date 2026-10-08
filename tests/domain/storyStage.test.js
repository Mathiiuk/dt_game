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

import { challengeFor, CHALLENGES, buildSequence, pickRumors, rumorWon, optionAtPosition, RUMORS } from '../../src/domain/storyStage'

describe('desafíos de pista', () => {
  it('cada capítulo tiene siempre el mismo desafío (o ninguno)', () => {
    const ev = { template_code: 'ARC_PIBE_2' }
    expect(challengeFor(ev)).toBe(challengeFor({ ...ev }))
    for (let i = 0; i < 30; i++) {
      const c = challengeFor({ template_code: `ARC_X_${i}` })
      expect(c === null || CHALLENGES.includes(c)).toBe(true)
    }
    const seen = new Set(Array.from({ length: 60 }, (_, i) => challengeFor({ template_code: `ARC_Z_${i}` })))
    expect(seen.size).toBeGreaterThan(2)
  })

  it('la secuencia tiene el largo pedido y símbolos válidos', () => {
    const seq = buildSequence(() => 0.99, 5, 6)
    expect(seq).toHaveLength(5)
    expect(seq.every(n => n >= 0 && n < 6)).toBe(true)
  })

  it('el verdadero o falso trae tres distintas y se gana con dos aciertos', () => {
    const r = pickRumors(() => 0.2)
    expect(r).toHaveLength(3)
    expect(new Set(r.map(x => x.text)).size).toBe(3)
    expect(rumorWon(r.map(x => x.ok), r)).toBe(true)
    expect(rumorWon([r[0].ok, r[1].ok, !r[2].ok], r)).toBe(true)
    expect(rumorWon([!r[0].ok, !r[1].ok, r[2].ok], r)).toBe(false)
    expect(RUMORS.filter(x => x.ok).length).toBeGreaterThan(3)
  })

  it('la barra de puntería cae en la opción que corresponde', () => {
    expect(optionAtPosition(0, 3)).toBe(0)
    expect(optionAtPosition(0.5, 3)).toBe(1)
    expect(optionAtPosition(1, 3)).toBe(2)
    expect(optionAtPosition(0.34, 3)).toBe(1)
  })
})
