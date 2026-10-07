import { STAGE_EVENTS } from '../../src/domain/climateEvents'
import { pickEvent } from '../../src/domain/barra'

const codesFor = (state, climate) => new Set(Array.from({ length: 400 }, (_, i) => pickEvent(STAGE_EVENTS, { climate, state }, () => (i + 0.5) / 400)).filter(Boolean).map(t => t.template_code))

describe('eventos por etapa de la barra y nivel de presión', () => {
  it('cada evento tiene opciones con id, texto y efectos, y ninguna opción cuesta más de lo razonable', () => {
    expect(STAGE_EVENTS.length).toBeGreaterThanOrEqual(6)
    for (const e of STAGE_EVENTS) {
      expect(e.template_code).toMatch(/^EVT_[A-Z_]+$/)
      expect(e.options.length).toBeGreaterThanOrEqual(2)
      for (const o of e.options) { expect(o.id && o.label && o.description).toBeTruthy(); expect(o.cost ?? 0).toBeLessThanOrEqual(1000) }
    }
    expect(new Set(STAGE_EVENTS.map(e => e.template_code)).size).toBe(STAGE_EVENTS.length)
  })

  it('los eventos de una etapa solo aparecen en esa etapa de la barra', () => {
    expect(codesFor({ barra: 'ASKS' }, 'TENSION').has('EVT_TICKET_RESELLING')).toBe(true)
    expect(codesFor({ barra: 'CALM' }, 'TENSION').has('EVT_TICKET_RESELLING')).toBe(false)
    expect(codesFor({ barra: 'PRESSURES' }, 'CRISIS').has('EVT_WALL_PAINTINGS')).toBe(true)
    expect(codesFor({ barra: 'ASKS' }, 'CRISIS').has('EVT_WALL_PAINTINGS')).toBe(false)
    expect(codesFor({ barra: 'SQUEEZES' }, 'CRISIS').has('EVT_PLAYER_AFRAID')).toBe(true)
    expect(codesFor({ barra: 'INVASION' }, 'CHAOS').has('EVT_PLAYER_AFRAID')).toBe(true)
    expect(codesFor({ barra: 'CALM' }, 'FLOWS').has('EVT_PLAYER_AFRAID')).toBe(false)
  })

  it('la presión alta trae el reclamo público del presidente y la baja, la semana tranquila', () => {
    expect(codesFor({ barra: 'CALM', pressure: 80 }, 'CRISIS').has('EVT_PRESIDENT_RADIO')).toBe(true)
    expect(codesFor({ barra: 'CALM', pressure: 30 }, 'TENSION').has('EVT_PRESIDENT_RADIO')).toBe(false)
    expect(codesFor({ barra: 'CALM', pressure: 10 }, 'FLOWS').has('EVT_QUIET_WEEK')).toBe(true)
    expect(codesFor({ barra: 'CALM', pressure: 70 }, 'FLOWS').has('EVT_QUIET_WEEK')).toBe(false)
  })

  it('con todo fluyendo y la barra en calma aparece la canción de la popular', () => {
    expect(codesFor({ barra: 'CALM', pressure: 20 }, 'FLOWS').has('EVT_POPULAR_SONG')).toBe(true)
    expect(codesFor({ barra: 'PRESSURES', pressure: 20 }, 'FLOWS').has('EVT_POPULAR_SONG')).toBe(false)
  })
})
