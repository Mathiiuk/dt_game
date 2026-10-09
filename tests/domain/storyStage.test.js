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

import { challengeFor, CHALLENGES, buildSequence, pickRumors, rumorWon, optionAtPosition, RUMORS, buildReflexTargets, buildBills, reflexWon, billsWon } from '../../src/domain/storyStage'

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

describe('reflejos y billetes', () => {
  it('las noticias aparecen dentro del área y con tiempo para tocarlas', () => {
    const t = buildReflexTargets(() => 0.99)
    expect(t).toHaveLength(5)
    expect(t.every(n => n.x <= 90 && n.y <= 90 && n.life >= 1000 && n.wait >= 350)).toBe(true)
  })

  it('hay seis billetes sueltos arriba y se gana salvando cinco', () => {
    const b = buildBills(() => 0.5)
    expect(b).toHaveLength(6)
    expect(b.every(x => x.y < 50)).toBe(true)
    expect(billsWon(5)).toBe(true)
    expect(billsWon(4)).toBe(false)
    expect(reflexWon(3)).toBe(true)
    expect(reflexWon(2)).toBe(false)
  })

  it('el desafío de billetes sólo sale en las crisis de plata', () => {
    const fin = new Set(Array.from({ length: 80 }, (_, i) => challengeFor({ category: 'FINANCIAL_CRISIS', template_code: `ARC_F_${i}` })))
    const other = new Set(Array.from({ length: 80 }, (_, i) => challengeFor({ category: 'COMMUNITY', template_code: `ARC_C_${i}` })))
    expect(fin.has('BILLS')).toBe(true)
    expect(other.has('BILLS')).toBe(false)
    expect(other.has('REFLEX')).toBe(true)
  })
})

import { CRITICAL_STAGE_MODES, EVENT_KIND_LABEL } from '../../src/domain/storyStage'

describe('decisiones sueltas del club', () => {
  it('una decisión urgente nunca se deja a la moneda ni al reloj', () => {
    for (let i = 0; i < 60; i++) {
      const mode = stageModeFor({ template_code: `EVT_CRITICO_${i}`, severity: 'CRITICAL' })
      expect(CRITICAL_STAGE_MODES).toContain(mode)
    }
    // Y con distintos eventos aparecen las dos formas serias
    expect(new Set(Array.from({ length: 60 }, (_, i) => stageModeFor({ template_code: `EVT_CRITICO_${i}`, severity: 'CRITICAL' }))).size).toBe(2)
  })

  it('las no urgentes siguen repartiéndose entre los cuatro modos', () => {
    const modes = new Set(Array.from({ length: 80 }, (_, i) => stageModeFor({ template_code: `EVT_COMUN_${i}`, severity: 'MEDIUM' })))
    expect(modes.size).toBe(4)
  })

  it('cada categoría de evento tiene su nombre para la cabecera', () => {
    for (const cat of ['COMMUNITY', 'LOCKER_ROOM', 'BOARD_PRESS', 'FINANCIAL_CRISIS']) expect(EVENT_KIND_LABEL[cat]).toBeTruthy()
  })
})

import { ALL_CHALLENGES, CATEGORY_CHALLENGES, buildChant, chantHit, chantWon, CHANT_BEATS, CHANT_WINDOW_MS, calmTick, calmWon, CALM_START, CALM_BAND, CALM_NEEDED, CALM_SECONDS, CALM_TICK_MS, buildHeadline, headlineNext, HEADLINES, buildBalance, balanceSum, balanceWon } from '../../src/domain/storyStage'

const seeded = (seed = 1) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

describe('cada tipo de evento tiene su minijuego', () => {
  it('el propio del tipo sale más seguido y estable para el mismo evento', () => {
    for (const [category, own] of Object.entries(CATEGORY_CHALLENGES)) {
      const picks = Array.from({ length: 200 }, (_, i) => challengeFor({ template_code: `EVT_${category}_${i}`, category }))
      expect(picks.filter(c => c === own).length).toBeGreaterThan(40)
      expect(picks.every(c => c === null || ALL_CHALLENGES.includes(c))).toBe(true)
      expect(challengeFor({ template_code: `EVT_${category}_3`, category })).toBe(challengeFor({ template_code: `EVT_${category}_3`, category }))
    }
  })

  it('los propios solo salen en su tipo de evento', () => {
    const picks = Array.from({ length: 300 }, (_, i) => challengeFor({ template_code: `EVT_X_${i}`, category: 'COMMUNITY' }))
    expect(picks.some(c => c === 'CALM' || c === 'HEADLINE' || c === 'BALANCE')).toBe(false)
    expect(picks.some(c => c === 'CHANT')).toBe(true)
  })
})

describe('el cántico', () => {
  it('hay cuatro golpes cada vez más tarde y con ritmo parejo pero no clavado', () => {
    const beats = buildChant(seeded(3))
    expect(beats).toHaveLength(CHANT_BEATS)
    for (let i = 1; i < beats.length; i++) {
      const gap = beats[i].at - beats[i - 1].at
      expect(gap).toBeGreaterThanOrEqual(650)
      expect(gap).toBeLessThan(1000)
    }
    expect(new Set([buildChant(seeded(1))[1].at, buildChant(seeded(9))[1].at]).size).toBe(2)
  })
  it('se acierta dentro de la ventana y con tres de cuatro se gana', () => {
    expect(chantHit(1000, 1000 + CHANT_WINDOW_MS)).toBe(true)
    expect(chantHit(1000, 1000 + CHANT_WINDOW_MS + 1)).toBe(false)
    expect(chantHit(1300, 1000)).toBe(false)
    expect(chantWon(3)).toBe(true)
    expect(chantWon(2)).toBe(false)
  })
})

describe('calmar al vestuario', () => {
  it('sin tocar la tensión sube siempre y con un toque baja', () => {
    let st = { tension: CALM_START, seconds: 0 }
    for (let i = 0; i < 10; i++) { const n = calmTick(st, false, seeded(i + 1)); expect(n.tension).toBeGreaterThan(st.tension); st = n }
    const tapped = calmTick({ tension: 60, seconds: 0 }, true, () => 0)
    expect(tapped.tension).toBe(54) // +2 y -8
  })
  it('solo cuenta el tiempo que está en la franja verde y la tensión no se sale de 0 a 100', () => {
    expect(calmTick({ tension: 50, seconds: 1 }, false, () => 0).seconds).toBe(1 + CALM_TICK_MS / 1000)
    expect(calmTick({ tension: 90, seconds: 1 }, false, () => 0).seconds).toBe(1)
    expect(calmTick({ tension: 2, seconds: 0 }, true, () => 0).tension).toBe(0)
    expect(calmTick({ tension: 99, seconds: 0 }, false, () => 0.99).tension).toBe(100)
    expect(CALM_BAND[0]).toBeLessThan(CALM_BAND[1])
  })
  it('se gana con 5,5 s en la franja de los 9 que dura', () => {
    expect(calmWon(CALM_NEEDED)).toBe(true)
    expect(calmWon(CALM_NEEDED - 0.25)).toBe(false)
    expect(CALM_NEEDED).toBeLessThan(CALM_SECONDS)
  })
  it('es posible ganar: tocando cuando se pasa de la franja se aguanta en el verde', () => {
    let st = { tension: CALM_START, seconds: 0 }
    const rng = seeded(5)
    for (let i = 0; i < (CALM_SECONDS * 1000) / CALM_TICK_MS; i++) st = calmTick(st, st.tension > 52, rng)
    expect(calmWon(st.seconds)).toBe(true)
  })
})

describe('armá el titular', () => {
  it('trae las palabras de un titular real mezcladas, nunca en orden', () => {
    for (let s = 1; s < 40; s++) {
      const { answer, words } = buildHeadline(seeded(s))
      expect(HEADLINES).toContain(answer)
      expect(words).toHaveLength(answer.length)
      expect(words.map(w => w.text).sort()).toEqual([...answer].sort())
      expect(words.every((w, i) => w.id === i)).toBe(false)
    }
  })
  it('tocar la palabra que sigue está bien y cualquier otra es un error', () => {
    const { words } = buildHeadline(seeded(4))
    const first = words.find(w => w.id === 0)
    const other = words.find(w => w.id !== 0)
    expect(headlineNext([], first)).toBe('OK')
    expect(headlineNext([], other)).toBe('MISTAKE')
    expect(headlineNext([0], words.find(w => w.id === 1))).toBe('OK')
  })
})

describe('cuadrar la caja', () => {
  it('el monto a cubrir sale de una combinación real de gastos: siempre hay solución', () => {
    for (let s = 1; s < 60; s++) {
      const { items, target } = buildBalance(seeded(s))
      expect(items).toHaveLength(5)
      expect(new Set(items.map(i => i.label)).size).toBe(5)
      const ids = items.map(i => i.id)
      const subsets = (k) => k === 0 ? [[]] : ids.flatMap(id => subsets(k - 1).filter(x => x.every(y => y < id)).map(x => [...x, id]))
      const found = [...subsets(2), ...subsets(3)].some(sel => balanceSum(sel, items) === target)
      expect(found).toBe(true)
    }
  })
  it('se gana con la suma exacta y no con una selección vacía', () => {
    const items = [{ id: 0, amount: 300 }, { id: 1, amount: 500 }, { id: 2, amount: 200 }]
    expect(balanceWon([0, 1], items, 800)).toBe(true)
    expect(balanceWon([0, 2], items, 800)).toBe(false)
    expect(balanceWon([], items, 0)).toBe(false)
  })
})
