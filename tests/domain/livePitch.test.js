import { pitchState, FIELD } from '../../src/domain/livePitch'

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
