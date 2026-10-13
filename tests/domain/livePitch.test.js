import { pitchState, FIELD, dotsFor, matchMarkers } from '../../src/domain/livePitch'

const ev = (minute, type, team, extra = {}) => ({ minute, type, team, ...extra })

describe('cancha en vivo: dónde está la pelota', () => {
  it('sin jugadas recientes la pelota anda por el medio, siempre dentro de la cancha y sin saltos al azar', () => {
    for (let m = 0; m <= 90; m++) {
      const a = pitchState({ events: [], minute: m })
      const b = pitchState({ events: [], minute: m })
      expect(a).toEqual(b)
      expect(a.ball.x).toBeGreaterThan(20)
      expect(a.ball.x).toBeLessThan(80)
      expect(a.ball.y).toBeGreaterThan(20)
      expect(a.ball.y).toBeLessThan(80)
    }
  })

  it('un remate del local (ataca a la derecha) lleva la pelota al área de la derecha; el visitante, a la izquierda', () => {
    expect(pitchState({ events: [ev(30, 'SHOT', 'home')], minute: 30 }).ball.x).toBeGreaterThan(80)
    expect(pitchState({ events: [ev(30, 'SHOT', 'away')], minute: 30 }).ball.x).toBeLessThan(20)
  })

  it('el penal es desde el punto penal y el córner desde la esquina', () => {
    const pen = pitchState({ events: [ev(10, 'PENALTY', 'home')], minute: 10 }).ball
    expect(pen).toEqual({ x: FIELD.penaltySpotRight, y: 50 })
    const corner = pitchState({ events: [ev(10, 'CORNER', 'away')], minute: 10 }).ball
    expect(corner.x).toBeLessThan(6)
    expect([8, 92]).toContain(corner.y)
  })

  it('una jugada vieja (más de 2 minutos) ya no mueve la pelota', () => {
    const s = pitchState({ events: [ev(10, 'SHOT', 'home')], minute: 14 })
    expect(s.ball.x).toBeLessThan(80)
    expect(s.focus).toBeNull()
  })

  it('las órdenes, cambios y el final no mueven la pelota', () => {
    for (const type of ['TACTIC_SHOUT', 'SUBSTITUTION', 'RIVAL_TACTIC', 'END']) {
      expect(pitchState({ events: [ev(20, type, 'home')], minute: 20 }).focus).toBeNull()
    }
  })

  it('un gol reciente se marca para el festejo, con el equipo que lo hizo', () => {
    const s = pitchState({ events: [ev(44, 'GOAL', 'away')], minute: 45 })
    expect(s.goal).toEqual({ team: 'away', minute: 44 })
    expect(pitchState({ events: [ev(44, 'GOAL', 'away')], minute: 47 }).goal).toBeNull()
  })

  it('las tarjetas se marcan con su color y no son del futuro', () => {
    expect(pitchState({ events: [ev(60, 'CARD_YELLOW', 'home')], minute: 60 }).card).toEqual({ kind: 'yellow', team: 'home', minute: 60 })
    expect(pitchState({ events: [ev(60, 'CARD_RED', 'home')], minute: 61 }).card.kind).toBe('red')
    expect(pitchState({ events: [ev(60, 'CARD_RED', 'home')], minute: 59 }).card).toBeNull()
  })

  it('ignora eventos de minutos que todavía no llegaron', () => {
    expect(pitchState({ events: [ev(70, 'GOAL', 'home')], minute: 30 }).goal).toBeNull()
  })

  it('con datos raros no se rompe', () => {
    expect(pitchState({ events: null, minute: undefined }).ball).toBeTruthy()
    expect(pitchState({ events: [null, {}, { type: 'GOAL' }], minute: 5 }).ball).toBeTruthy()
  })
})

describe('cancha en vivo 2.0: jugadores y línea de tiempo', () => {
  const layout = [{ slot: 'PO', x: 50, y: 91 }, { slot: 'DC1', x: 37, y: 20 }, { slot: 'DC2', x: 63, y: 20 }]

  it('el local ataca a la derecha: el arquero queda a la izquierda y los delanteros hacia el arco rival', () => {
    const dots = dotsFor({ layout, side: 'home', ball: { x: 50, y: 50 } })
    expect(dots).toHaveLength(3)
    const gk = dots.find(d => d.slot === 'PO')
    const st = dots.find(d => d.slot === 'DC1')
    expect(gk.x).toBeLessThan(15)
    expect(st.x).toBeGreaterThan(70)
    expect(gk.y).toBe(50)
  })

  it('el visitante ataca a la izquierda: todo espejado', () => {
    const dots = dotsFor({ layout, side: 'away', ball: { x: 50, y: 50 } })
    const gk = dots.find(d => d.slot === 'PO')
    const st = dots.find(d => d.slot === 'DC1')
    expect(gk.x).toBeGreaterThan(85)
    expect(st.x).toBeLessThan(30)
    expect(gk.y).toBe(50)
    expect(st.y).toBe(63)
  })

  it('el equipo se corre hacia donde está la pelota, pero el arquero casi no se mueve y todos quedan dentro de la cancha', () => {
    const calm = dotsFor({ layout, side: 'home', ball: { x: 50, y: 50 } })
    const push = dotsFor({ layout, side: 'home', ball: { x: 90, y: 50 } })
    const back = dotsFor({ layout, side: 'home', ball: { x: 10, y: 50 } })
    const st = (d) => d.find(p => p.slot === 'DC1').x
    const gk = (d) => d.find(p => p.slot === 'PO').x
    expect(st(push)).toBeGreaterThan(st(calm))
    expect(st(back)).toBeLessThan(st(calm))
    expect(Math.abs(gk(push) - gk(calm))).toBeLessThan(Math.abs(st(push) - st(calm)))
    for (const d of [...push, ...back]) { expect(d.x).toBeGreaterThanOrEqual(3); expect(d.x).toBeLessThanOrEqual(97) }
  })

  it('sin formación o con datos raros devuelve una lista vacía', () => {
    expect(dotsFor({ layout: null, side: 'home', ball: { x: 50, y: 50 } })).toEqual([])
    expect(dotsFor({ layout: [null, {}, { slot: 'X' }], side: 'home' })).toEqual([])
  })

  it('los marcadores del partido: goles, tarjetas y cambios hasta el minuto actual, en orden', () => {
    const events = [
      { minute: 30, type: 'GOAL', team: 'away' },
      { minute: 10, type: 'GOAL', team: 'home' },
      { minute: 20, type: 'CARD_YELLOW', team: 'home' },
      { minute: 25, type: 'CARD_RED', team: 'away' },
      { minute: 46, type: 'SUBSTITUTION', team: 'home' },
      { minute: 12, type: 'SHOT', team: 'home' },
      { minute: 80, type: 'GOAL', team: 'home' }
    ]
    const m = matchMarkers(events, 46)
    expect(m.map(x => [x.minute, x.kind, x.team])).toEqual([
      [10, 'goal', 'home'], [20, 'yellow', 'home'], [25, 'red', 'away'], [30, 'goal', 'away'], [46, 'sub', 'home']
    ])
  })

  it('los marcadores toleran datos raros', () => {
    expect(matchMarkers(null, 10)).toEqual([])
    expect(matchMarkers([null, {}, { type: 'GOAL' }], 10)).toEqual([])
  })
})
