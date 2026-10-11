import { matchMinuteRisk, postMatchRisk, chanceOfInjuryInMatch, MATCH_BASE_PER_MINUTE, POST_MATCH_BASE } from '../../src/domain/injuryRates'
import { simulateMatch } from '../../src/api/matchEngine'

const calm = { mentality: 'BALANCED', tempo: 'NORMAL', pressing_intensity: 'BALANCED' }
const allIn = { mentality: 'ATTACKING', tempo: 'FAST', pressing_intensity: 'AGGRESSIVE' }

describe('riesgo de lesión por partido', () => {
  it('las bases bajaron: 0,26 % por minuto entre los dos equipos y 0,9 % por jugador al terminar', () => {
    expect(MATCH_BASE_PER_MINUTE).toBe(0.0026)
    expect(POST_MATCH_BASE).toBe(0.009)
  })

  it('el riesgo por minuto sube con el cansancio, el ritmo rápido, la presión alta y la mentalidad ofensiva', () => {
    const rested = matchMinuteRisk(calm, 92)
    expect(matchMinuteRisk(calm, 70)).toBeGreaterThan(matchMinuteRisk(calm, 85))
    expect(matchMinuteRisk(calm, 45)).toBeGreaterThan(matchMinuteRisk(calm, 70))
    expect(matchMinuteRisk(allIn, 85)).toBeGreaterThan(matchMinuteRisk(calm, 85))
    expect(matchMinuteRisk({ ...calm, tempo: 'SLOW', pressing_intensity: 'STAND_OFF' }, 85)).toBeLessThan(matchMinuteRisk(calm, 85))
    expect(rested).toBeLessThan(MATCH_BASE_PER_MINUTE)
  })

  it('al terminar el partido el riesgo del jugador sube con el cansancio y con la cancha mala, y tiene tope', () => {
    expect(postMatchRisk({ state_fitness: 85 }, 70)).toBeCloseTo(0.009, 5)
    expect(postMatchRisk({ state_fitness: 70 }, 70)).toBeCloseTo(0.0135, 5)
    expect(postMatchRisk({ state_fitness: 60 }, 70)).toBeCloseTo(0.027, 5)
    expect(postMatchRisk({ state_fitness: 40 }, 70)).toBeCloseTo(0.045, 5)
    expect(postMatchRisk({ state_fitness: 85 }, 30)).toBeGreaterThan(postMatchRisk({ state_fitness: 85 }, 70))
    expect(postMatchRisk({ state_fitness: 0 }, 10)).toBeLessThanOrEqual(0.25)
  })

  it('con un plantel descansado se lesiona alguien en ~1 de cada 5 partidos (entre 15 y 25 %)', () => {
    const c = chanceOfInjuryInMatch({ tactic: calm, fitness: 85, starters: 11, pitchQuality: 70 })
    expect(c).toBeGreaterThan(0.15)
    expect(c).toBeLessThan(0.25)
  })

  it('con un plantel agotado y jugando a todo o nada, pasa bastante más', () => {
    const tired = chanceOfInjuryInMatch({ tactic: allIn, fitness: 55, starters: 11, pitchQuality: 70 })
    expect(tired).toBeGreaterThan(chanceOfInjuryInMatch({ tactic: calm, fitness: 85, starters: 11, pitchQuality: 70 }) * 1.6)
  })
})

describe('el motor de partidos usa las tasas nuevas', () => {
  const squad = (prefix) => Array.from({ length: 14 }, (_, i) => ({
    id: `${prefix}${i}`, first_name: 'N', last_name: `${i}`, position: i === 0 ? 'PO' : i < 5 ? 'DFC' : i < 9 ? 'MC' : 'DC',
    attr_overall: 60, attr_stamina: 60, state_fitness: 85, shirt_number: i + 1
  }))

  it('con 300 partidos simulados, entre el 15 y el 27 % tiene una lesión durante el juego (de cualquiera de los dos equipos)', () => {
    let hurt = 0
    const n = 300
    for (let s = 0; s < n; s++) {
      const r = simulateMatch(calm, squad('h'), calm, squad('a'), `inj-${s}`)
      if (r.events.some(e => e.type === 'INJURY')) hurt++
    }
    expect(hurt / n).toBeGreaterThan(0.15)
    expect(hurt / n).toBeLessThan(0.27)
  })
})
