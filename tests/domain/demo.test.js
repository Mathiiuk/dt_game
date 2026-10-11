import { DEMO_START, DEMO_DECISIONS, DEMO_CLUB, applyEffects, chipsFor, teamStrength, playDemoMatch, applyPenalty, headlines, verdictFor } from '../../src/domain/demo'
import { HISTORICAL_CLUBS_BY_TIER } from '../../src/domain/historicalClubs'

describe('demo bizarra: decisiones y medidores', () => {
  it('hay tres decisiones con tres opciones cada una y efectos sobre los medidores', () => {
    expect(DEMO_DECISIONS).toHaveLength(3)
    for (const d of DEMO_DECISIONS) {
      expect(d.title && d.text).toBeTruthy()
      expect(d.options).toHaveLength(3)
      for (const o of d.options) {
        expect(o.id && o.label && o.reaction).toBeTruthy()
        expect(Object.keys(o.effects).length).toBeGreaterThan(0)
      }
    }
    expect(new Set(DEMO_DECISIONS.map(d => d.id)).size).toBe(3)
  })

  it('los efectos se suman con tope de 0 a 100 (y la suerte entre -2 y 2)', () => {
    const up = applyEffects(DEMO_START, { barra: 80, suerte: 5 })
    expect(up.barra).toBe(100)
    expect(up.suerte).toBe(2)
    const down = applyEffects(DEMO_START, { caja: -90, suerte: -5 })
    expect(down.caja).toBe(0)
    expect(down.suerte).toBe(-2)
    expect(DEMO_START.barra).toBe(50) // no muta
  })

  it('las etiquetas de efectos muestran solo lo que cambia, con su signo', () => {
    expect(chipsFor({ barra: 15, caja: -10, suerte: 1 })).toEqual([
      { key: 'caja', label: 'Caja', delta: -10 },
      { key: 'barra', label: 'Barra', delta: 15 },
      { key: 'suerte', label: 'Árbitro', delta: 1 }
    ])
  })
})

describe('demo bizarra: el partido', () => {
  const stats = applyEffects(DEMO_START, { vestuario: 20, barra: 10 })

  it('un vestuario unido y la barra a favor dan un equipo más fuerte', () => {
    expect(teamStrength(stats)).toBeGreaterThan(teamStrength(DEMO_START))
    expect(teamStrength(applyEffects(DEMO_START, { vestuario: -30 }))).toBeLessThan(teamStrength(DEMO_START))
  })

  it('el mismo partido sale siempre igual y la cronología está ordenada, con comienzo y final', () => {
    const a = playDemoMatch('seed-1', stats)
    expect(playDemoMatch('seed-1', stats)).toEqual(a)
    const minutes = a.events.map(e => e.minute)
    expect([...minutes].sort((x, y) => x - y)).toEqual(minutes)
    expect(a.events[0].type).toBe('start')
    expect(a.events.at(-1).type).toBe('end')
    expect(a.score.me).toBeGreaterThanOrEqual(0)
    expect(a.score.me).toBeLessThanOrEqual(6)
    expect(a.events.filter(e => e.type === 'goal-me')).toHaveLength(a.score.me)
    expect(a.events.filter(e => e.type === 'goal-rival')).toHaveLength(a.score.rival)
  })

  it('el rival y los jugadores son ficticios: no aparece ningún club real', () => {
    const clubs = [...new Set(Object.values(HISTORICAL_CLUBS_BY_TIER).flat().map(c => c.name))]
    const m = playDemoMatch('seed-2', stats)
    const text = JSON.stringify(m) + DEMO_CLUB + JSON.stringify(DEMO_DECISIONS)
    for (const club of clubs) expect(text.includes(club), club).toBe(false)
    expect(m.rival).toBeTruthy()
  })

  it('el penal final suma un gol si sale bien (calidad alta) y falla si sale mal', () => {
    const base = playDemoMatch('seed-3', stats)
    const ok = applyPenalty(base, 0.9)
    expect(ok.score.me).toBe(base.score.me + 1)
    expect(ok.events.at(-2).type).toBe('penalty-goal')
    const bad = applyPenalty(base, 0.1)
    expect(bad.score.me).toBe(base.score.me)
    expect(bad.events.at(-2).type).toBe('penalty-miss')
    expect(ok.events.at(-1).type).toBe('end')
  })

  it('con el árbitro comprado la suerte inclina el resultado a favor', () => {
    let better = 0
    for (let i = 0; i < 60; i++) {
      const lucky = playDemoMatch(`s${i}`, applyEffects(DEMO_START, { suerte: 2 }))
      const unlucky = playDemoMatch(`s${i}`, applyEffects(DEMO_START, { suerte: -2 }))
      if (lucky.score.me - lucky.score.rival >= unlucky.score.me - unlucky.score.rival) better++
    }
    expect(better).toBeGreaterThan(48)
  })
})

describe('demo bizarra: los titulares del día siguiente', () => {
  it('son tres, hablan del resultado y de lo que decidiste, y siempre iguales para lo mismo', () => {
    const match = applyPenalty(playDemoMatch('seed-4', DEMO_START), 0.9)
    const stats = applyEffects(DEMO_START, { dirigencia: -30, barra: 30 })
    const h = headlines({ match, stats })
    expect(h).toHaveLength(3)
    expect(h.every(Boolean)).toBe(true)
    expect(headlines({ match, stats })).toEqual(h)
    expect(h.join(' ')).toMatch(new RegExp(`${match.score.me}`))
  })

  it('el veredicto final cambia con lo que pasó', () => {
    expect(verdictFor({ score: { me: 3, rival: 0 } }, DEMO_START).title).not.toBe(verdictFor({ score: { me: 0, rival: 3 } }, DEMO_START).title)
    expect(verdictFor({ score: { me: 1, rival: 1 } }, applyEffects(DEMO_START, { dirigencia: -50 })).text).toMatch(/dirigen/i)
  })
})
