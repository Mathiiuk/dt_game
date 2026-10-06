import {
  generateCharacters, ensureCharacters, renderText, renderTemplate, rememberBarraVisit, adjustGrudge, rumorBoost,
  BARRA_LEADERS, PRESIDENTS, JOURNALISTS, presidentShortName
} from '../../src/domain/characters'
import { BARRA_EVENTS, EMERGENCY_MEETING, BOARD_FAVOR_DUE, CLIMATE_EVENTS } from '../../src/domain/climateEvents'

describe('personajes del club', () => {
  it('se sortean una vez y son siempre los mismos para el mismo club', () => {
    const a = generateCharacters('club-1')
    expect(generateCharacters('club-1')).toEqual(a)
    expect(BARRA_LEADERS).toContain(a.barra.name)
    expect(PRESIDENTS).toContain(a.president.name)
    expect(JOURNALISTS.map(j => j.name)).toContain(a.journalist.name)
    expect(a.barra.times).toBe(0)
    expect(a.journalist.grudge).toBe(0)
  })

  it('clubes distintos tienen personajes distintos', () => {
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(s => generateCharacters(s).barra.name)
    expect(new Set(names).size).toBeGreaterThan(2)
  })

  it('completar los personajes no pisa lo que ya recuerdan', () => {
    const merged = ensureCharacters({ barra: { name: 'el Oso', times: 3 }, journalist: { grudge: 2 } }, 'club-1')
    expect(merged.barra).toEqual({ name: 'el Oso', times: 3 })
    expect(merged.journalist.grudge).toBe(2)
    expect(merged.journalist.name).toBeTruthy()
    expect(merged.president.name).toBeTruthy()
    expect(ensureCharacters(null, 'x').barra.name).toBeTruthy()
  })
})

describe('textos con personajes', () => {
  const chars = { barra: { name: 'el Oso' }, president: { name: 'Don Raúl Benítez' }, journalist: { name: 'Pepe Cabrera', outlet: 'Radio del Barrio' } }

  it('reemplaza los marcadores, con mayúscula al empezar la frase', () => {
    expect(renderText('{Barra} te saluda. Le dijiste a {barra} que no.', chars)).toBe('El Oso te saluda. Le dijiste a el Oso que no.')
    expect(renderText('{presidente} te llama', chars)).toBe('Don Raúl te llama')
    expect(renderText('{periodista}, de {medio}, publicó', chars)).toBe('Pepe Cabrera, de Radio del Barrio, publicó')
    expect(presidentShortName('Doña Marta Ibáñez')).toBe('Doña Marta')
  })

  it('sin personajes usa un nombre genérico y nunca deja llaves', () => {
    const text = renderText('{Barra} {barra} {presidente} {periodista} {medio}', null)
    expect(text).not.toMatch(/[{}]/)
  })

  it('todos los textos de los eventos del clima se personalizan sin dejar marcadores sueltos', () => {
    const all = [...Object.values(BARRA_EVENTS), EMERGENCY_MEETING, BOARD_FAVOR_DUE, ...CLIMATE_EVENTS]
    for (const t of all) {
      const rendered = renderTemplate(t, chars)
      const texts = [rendered.title, rendered.description, ...rendered.options.flatMap(o => [o.label, o.description])]
      for (const text of texts) expect(text).not.toMatch(/\{(Barra|barra|presidente|periodista|medio)\}/)
    }
  })

  it('los eventos nombran a la barra, al presidente y al periodista', () => {
    expect(renderTemplate(BARRA_EVENTS.PRESSURES, chars).description).toContain('El Oso')
    expect(renderTemplate(BARRA_EVENTS.SQUEEZES, chars).description).toContain('el Oso')
    expect(renderTemplate(EMERGENCY_MEETING, chars).description).toContain('Don Raúl')
    const rumor = CLIMATE_EVENTS.find(t => t.template_code === 'EVT_DISMISSAL_RUMOR')
    expect(renderTemplate(rumor, chars).description).toContain('Pepe Cabrera, de Radio del Barrio')
  })
})

describe('memoria de los personajes', () => {
  it('la barra cuenta sus visitas y las recuerda desde la segunda', () => {
    const first = rememberBarraVisit({ barra: { name: 'el Oso', times: 0 } })
    expect(first.characters.barra.times).toBe(1)
    expect(first.memory).toBe('')
    const second = rememberBarraVisit(first.characters)
    expect(second.memory).toMatch(/El Oso ya vino antes/)
    const third = rememberBarraVisit(second.characters)
    expect(third.memory).toMatch(/ya vino 3 veces/)
  })

  it('el rencor sube y baja sin salirse de 0 a 5', () => {
    let chars = { journalist: { grudge: 4 } }
    chars = adjustGrudge(chars, 1)
    expect(chars.journalist.grudge).toBe(5)
    expect(adjustGrudge(chars, 1).journalist.grudge).toBe(5)
    expect(adjustGrudge({ journalist: { grudge: 0 } }, -1).journalist.grudge).toBe(0)
    expect(adjustGrudge({}, 2).journalist.grudge).toBe(2)
  })

  it('el rumor se vuelve más probable con rencor, hasta 25%', () => {
    expect(rumorBoost({ journalist: { grudge: 0 } })).toBe(0)
    expect(rumorBoost({ journalist: { grudge: 2 } })).toBeCloseTo(0.1)
    expect(rumorBoost({ journalist: { grudge: 5 } })).toBeCloseTo(0.25)
    expect(rumorBoost(null)).toBe(0)
  })
})
