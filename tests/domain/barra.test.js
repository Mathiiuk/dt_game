import {
  BARRA_STAGES, shiftBarra, nextBarraStage, barraWeeklyEffect, auditChance, scandalOutcome, eventProbability, pickEvent, SUSPENSION_POWER_FACTOR
} from '../../src/domain/barra'
import { DIFFICULTY } from '../../src/domain/consequences'
import { BARRA_EVENTS, EMERGENCY_MEETING, BOARD_FAVOR_DUE, CLIMATE_EVENTS } from '../../src/domain/climateEvents'
import { FULL_EVENTS_CATALOG } from '../../src/api/events'

describe('la barra', () => {
  it('sube un escalón por semana en crisis y no pasa de la invasión', () => {
    expect(nextBarraStage({ stage: 'CALM', climate: 'CRISIS' })).toBe('ASKS')
    expect(nextBarraStage({ stage: 'PRESSURES', climate: 'CRISIS' })).toBe('SQUEEZES')
    expect(nextBarraStage({ stage: 'INVASION', climate: 'CHAOS' })).toBe('INVASION')
  })

  it('en el caos con dificultad realista avanza dos escalones', () => {
    expect(nextBarraStage({ stage: 'CALM', climate: 'CHAOS' })).toBe('ASKS')
    expect(nextBarraStage({ stage: 'CALM', climate: 'CHAOS' }, DIFFICULTY.REALISTIC)).toBe('PRESSURES')
  })

  it('con el equipo bien vuelve a la calma', () => {
    expect(nextBarraStage({ stage: 'SQUEEZES', climate: 'FLOWS' })).toBe('PRESSURES')
    expect(nextBarraStage({ stage: 'ASKS', climate: 'TENSION', recentWin: true })).toBe('CALM')
    expect(nextBarraStage({ stage: 'ASKS', climate: 'TENSION', recentWin: false })).toBe('ASKS')
    expect(shiftBarra('CALM', -3)).toBe('CALM')
    expect(shiftBarra('CALM', 9)).toBe(BARRA_STAGES[BARRA_STAGES.length - 1])
  })

  it('el vestuario sufre más cuanto más arriba está la barra', () => {
    expect(barraWeeklyEffect('CALM').locker).toBe(0)
    expect(barraWeeklyEffect('PRESSURES').locker).toBe(-2)
    expect(barraWeeklyEffect('SQUEEZES').locker).toBe(-5)
    expect(barraWeeklyEffect('INVASION').locker).toBe(-10)
    expect(barraWeeklyEffect('INVASION', DIFFICULTY.REALISTIC).locker).toBe(-13)
  })
})

describe('auditoría y escándalos', () => {
  it('sin favores no hay auditoría y con muchos llega al 40%', () => {
    expect(auditChance(0)).toBe(0)
    expect(auditChance(1)).toBeCloseTo(0.03)
    expect(auditChance(3)).toBeGreaterThan(auditChance(2))
    expect(auditChance(50)).toBe(0.4)
  })

  it('escándalo 1: multa; 2: suspensión de un partido; 3: despido', () => {
    expect(scandalOutcome(1)).toMatchObject({ kind: 'FINE', board: -15, suspendMatches: 0, dismissal: false })
    expect(scandalOutcome(2)).toMatchObject({ kind: 'SUSPENSION', suspendMatches: 1, dismissal: false })
    expect(scandalOutcome(3)).toMatchObject({ kind: 'DISMISSAL', dismissal: true })
    expect(SUSPENSION_POWER_FACTOR).toBe(0.95)
  })
})

describe('eventos según el clima', () => {
  it('la probabilidad semanal crece con la presión', () => {
    expect(eventProbability('FLOWS')).toBe(0.2)
    expect(eventProbability('TENSION')).toBe(0.3)
    expect(eventProbability('CRISIS')).toBe(0.45)
    expect(eventProbability('CHAOS')).toBe(0.6)
    expect(eventProbability('CRISIS', DIFFICULTY.RELAXED)).toBeCloseTo(0.35)
    expect(eventProbability('CRISIS', DIFFICULTY.REALISTIC)).toBeCloseTo(0.55)
    expect(eventProbability('FLOWS', DIFFICULTY.REALISTIC)).toBe(0.2)
  })

  it('con todo en calma no aparece la corrupción ni los aprietes, y en crisis sí', () => {
    const codes = (climate) => new Set(Array.from({ length: 300 }, (_, i) => pickEvent(FULL_EVENTS_CATALOG, { climate, state: {} }, () => (i + 0.5) / 300)).filter(Boolean).map(t => t.template_code))
    const calm = codes('FLOWS')
    expect(calm.has('EVT_SPONSOR_UPGRADE')).toBe(true)
    expect(calm.has('EVT_CORRUPT_COMMISSION')).toBe(false)
    expect(calm.has('EVT_BRIBERY_ATTEMPT')).toBe(false)
    const crisis = codes('CRISIS')
    expect(crisis.has('EVT_CORRUPT_COMMISSION')).toBe(true)
    expect(crisis.has('EVT_PRESIDENT_SQUEEZE')).toBe(true)
    expect(crisis.has('EVT_SPONSOR_UPGRADE')).toBe(false)
  })

  it('no repite un evento que ya está pendiente y respeta las condiciones', () => {
    const only = [{ template_code: 'A', climates: ['CRISIS'] }, { template_code: 'B', climates: ['CRISIS'], when: (s) => s.favors > 3 }]
    expect(pickEvent(only, { climate: 'CRISIS', state: { favors: 0 }, pendingCodes: new Set(['A']) })).toBeNull()
    expect(pickEvent(only, { climate: 'CRISIS', state: { favors: 5 }, pendingCodes: new Set(['A']) }).template_code).toBe('B')
  })
})

describe('catálogo de eventos', () => {
  const CATEGORIES = ['COMMUNITY', 'LOCKER_ROOM', 'BOARD_PRESS', 'FINANCIAL_CRISIS']
  const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const EFFECT_KEYS = ['budget', 'fans', 'board', 'locker', 'locker_room', 'morale', 'reputation', 'barra', 'favors', 'board_owed', 'board_set', 'action']
  const all = [...FULL_EVENTS_CATALOG, ...Object.values(BARRA_EVENTS), EMERGENCY_MEETING, BOARD_FAVOR_DUE]

  it('todos los eventos cumplen lo que exige la base y usan efectos conocidos', () => {
    for (const t of all) {
      expect(CATEGORIES).toContain(t.category)
      expect(SEVERITIES).toContain(t.severity)
      expect(t.options.length).toBeGreaterThanOrEqual(2)
      for (const o of t.options) {
        expect(o.id).toBeTruthy()
        expect(o.label.length).toBeGreaterThan(5)
        for (const key of Object.keys(o.effects || {})) expect(EFFECT_KEYS).toContain(key)
      }
    }
  })

  it('los códigos son únicos', () => {
    const codes = all.map(t => t.template_code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('cada pedido de la barra ofrece ceder, negarse, derivar y denunciar (con respaldo de la dirigencia)', () => {
    for (const t of Object.values(BARRA_EVENTS)) {
      expect(t.options.map(o => o.id)).toEqual(['CEDE', 'REFUSE', 'BOARD_HANDLES', 'DENOUNCE'])
      expect(t.options[3].requires).toEqual({ board: 55 })
      expect(t.options[0].effects.favors).toBe(1)
    }
  })

  it('toda oferta de corrupción suma un favor al aceptar y solo aparece en crisis', () => {
    const corrupt = CLIMATE_EVENTS.filter(t => t.template_code.startsWith('EVT_CORRUPT_'))
    expect(corrupt).toHaveLength(4)
    for (const t of corrupt) {
      expect(t.climates).toEqual(['CRISIS', 'CHAOS'])
      expect(t.options.find(o => o.id === 'ACCEPT').effects.favors).toBe(1)
    }
  })

  it('la reunión de emergencia ofrece ceder, plantarse o renunciar', () => {
    expect(EMERGENCY_MEETING.options.map(o => o.id)).toEqual(['GIVE_IN', 'STAND_FIRM', 'RESIGN'])
    expect(EMERGENCY_MEETING.options[0].effects.board_set).toBe(20)
  })
})
