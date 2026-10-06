import { rivalLevel, rivalOf } from '../../src/domain/rivalLevel'

describe('nivel del rival', () => {
  it('clasifica la fuerza del rival en cuatro escalones', () => {
    expect(rivalLevel(46).label).toBe('Accesible')
    expect(rivalLevel(52).label).toBe('Accesible')
    expect(rivalLevel(53).label).toBe('Parejo')
    expect(rivalLevel(58).label).toBe('Parejo')
    expect(rivalLevel(60).label).toBe('Fuerte')
    expect(rivalLevel(62.4)).toMatchObject({ label: 'Fuerte', level: 62 })
    expect(rivalLevel(66)).toMatchObject({ label: 'Candidato', tone: 'danger' })
  })

  it('sin fuerza no inventa un nivel', () => {
    expect(rivalLevel(null)).toBeNull()
    expect(rivalLevel(undefined)).toBeNull()
    expect(rivalLevel('x')).toBeNull()
  })

  it('el rival es el club que no es el tuyo', () => {
    const fixture = { home_team_id: 'me', away_team_id: 'ai', home: { name: 'Yo' }, away: { name: 'Ellos' } }
    expect(rivalOf(fixture, 'me').name).toBe('Ellos')
    expect(rivalOf(fixture, 'ai').name).toBe('Yo')
    expect(rivalOf(null, 'me')).toBeNull()
  })
})
