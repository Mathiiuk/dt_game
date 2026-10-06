import { detectMoment, halftimeTalk, shoutWaitMinutes, shoutBuff, scoreAt, SHOUT_COOLDOWN_MINUTES } from '../../src/domain/quickDecisions'

const goal = (minute, team) => ({ minute, type: 'GOAL', team })

describe('decisiones rápidas', () => {
  it('el marcador se arma con los goles hasta el minuto', () => {
    expect(scoreAt([goal(10, 'home'), goal(50, 'away'), goal(80, 'away')], 60)).toEqual({ home: 1, away: 1 })
  })

  it('en el minuto 45 hay charla de entretiempo, una sola vez', () => {
    const m = detectMoment({ minute: 45, events: [], userSide: 'home', fired: new Set() })
    expect(m.key).toBe('HALFTIME')
    expect(m.options).toHaveLength(3)
    expect(detectMoment({ minute: 45, events: [], userSide: 'home', fired: new Set(['HALFTIME']) })).toBeNull()
  })

  it('elogiar rinde mucho con el vestuario contento y casi nada con el vestuario caído', () => {
    const praise = (morale) => halftimeTalk({ morale }).options.find(o => o.id === 'HT_PRAISE').buff.att
    expect(praise(80)).toBeGreaterThan(praise(30))
  })

  it('una roja en contra y una roja del rival ofrecen decisiones distintas', () => {
    const red = (team) => [{ minute: 30, type: 'CARD_RED', team, playerId: 'p1' }]
    expect(detectMoment({ minute: 30, events: red('home'), userSide: 'home', fired: new Set() }).id).toBe('RED_AGAINST')
    expect(detectMoment({ minute: 30, events: red('away'), userSide: 'home', fired: new Set() }).id).toBe('RED_FOR')
  })

  it('una lesión propia permite sacarlo (abre los cambios) o que siga', () => {
    const m = detectMoment({ minute: 20, events: [{ minute: 20, type: 'INJURY', team: 'away', playerId: 'z', text: 'x' }], userSide: 'away', fired: new Set() })
    expect(m.playerId).toBe('z')
    expect(m.options.find(o => o.id === 'INJ_OUT').action).toBe('OPEN_SUBS')
    expect(detectMoment({ minute: 20, events: [{ minute: 20, type: 'INJURY', team: 'home', playerId: 'z' }], userSide: 'away', fired: new Set() })).toBeNull()
  })

  it('perdiendo por dos pasados los 60 y ganando pasados los 75', () => {
    expect(detectMoment({ minute: 61, events: [goal(5, 'away'), goal(20, 'away')], userSide: 'home', fired: new Set() }).id).toBe('TRAILING')
    expect(detectMoment({ minute: 50, events: [goal(5, 'away'), goal(20, 'away')], userSide: 'home', fired: new Set() })).toBeNull()
    expect(detectMoment({ minute: 76, events: [goal(5, 'home')], userSide: 'home', fired: new Set() }).id).toBe('PROTECT')
    expect(detectMoment({ minute: 76, events: [goal(5, 'home')], userSide: 'home', fired: new Set(['PROTECT']) })).toBeNull()
  })

  it('sin nada para decidir no interrumpe y al final no hay momentos', () => {
    expect(detectMoment({ minute: 30, events: [], userSide: 'home', fired: new Set() })).toBeNull()
    expect(detectMoment({ minute: 90, events: [goal(1, 'away'), goal(2, 'away')], userSide: 'home', fired: new Set() })).toBeNull()
  })

  it('los gritos tienen enfriamiento de 15 minutos', () => {
    expect(shoutWaitMinutes(null, 30)).toBe(0)
    expect(shoutWaitMinutes(30, 35)).toBe(SHOUT_COOLDOWN_MINUTES - 5)
    expect(shoutWaitMinutes(30, 45)).toBe(0)
    expect(shoutBuff({ attBuff: 1.2, defBuff: 0.85 })).toEqual({ att: 1.2, def: 0.85, mid: 1 })
  })
})

describe('momentos de penal y arquero lesionado', () => {
  const field = [
    { id: 'gk', first_name: 'Arq', last_name: 'Uero', position: 'PO', slot_base: 'PO', attr_overall: 60, attr_finishing: 10 },
    { id: 'ace', first_name: 'Ace', last_name: 'Pateador', position: 'DC', attr_overall: 62, attr_finishing: 90 },
    { id: 'good', first_name: 'Buen', last_name: 'Pie', position: 'MC', attr_overall: 60, attr_finishing: 70 },
    { id: 'ok', first_name: 'Co', last_name: 'Mún', position: 'MC', attr_overall: 58, attr_finishing: 55 },
    { id: 'dud', first_name: 'Ma', last_name: 'Lo', position: 'DFC', attr_overall: 55, attr_finishing: 20 }
  ]
  const penalty = (team) => [{ minute: 30, type: 'PENALTY', team, text: '¡PENAL!' }]

  it('un penal a favor ofrece a los mejores definidores con su probabilidad y la opción de dejarlo a quien corresponde', () => {
    const m = detectMoment({ minute: 30, events: penalty('home'), userSide: 'home', fired: new Set(), onField: field })
    expect(m.id).toBe('PENALTY_FOR')
    const takers = m.options.filter(o => o.action === 'PENALTY_TAKER' && o.playerId)
    expect(takers.map(o => o.playerId)).toEqual(['ace', 'good', 'ok'])
    expect(takers[0].label).toMatch(/Ace Pateador/)
    expect(takers[0].desc).toMatch(/90%/)
    expect(m.options.some(o => o.action === 'PENALTY_TAKER' && !o.playerId)).toBe(true)
  })

  it('el arquero no figura entre los que patean, y con pocos jugadores no inventa opciones', () => {
    const m = detectMoment({ minute: 30, events: penalty('home'), userSide: 'home', fired: new Set(), onField: field })
    expect(m.options.some(o => o.playerId === 'gk')).toBe(false)
    const few = detectMoment({ minute: 30, events: penalty('home'), userSide: 'home', fired: new Set(), onField: field.slice(0, 2) })
    expect(few.options.filter(o => o.playerId)).toHaveLength(1)
  })

  it('un penal en contra deja elegir hacia dónde se tira el arquero', () => {
    const m = detectMoment({ minute: 30, events: penalty('away'), userSide: 'home', fired: new Set(), onField: field })
    expect(m.id).toBe('PENALTY_AGAINST')
    expect(m.options.map(o => o.dive)).toEqual(['L', 'C', 'R'])
    expect(m.options.every(o => o.action === 'PENALTY_DIVE')).toBe(true)
  })

  it('cada penal pide su decisión una sola vez', () => {
    const fired = new Set(['PENALTY_30'])
    expect(detectMoment({ minute: 30, events: penalty('home'), userSide: 'home', fired, onField: field })).toBeNull()
  })

  it('si se lesiona el arquero el aviso es más grave y la opción de seguir cuesta más', () => {
    const events = [{ minute: 20, type: 'INJURY', team: 'home', playerId: 'gk', text: 'Atención médica para el arquero.' }]
    const m = detectMoment({ minute: 20, events, userSide: 'home', fired: new Set(), onField: field })
    expect(m.id).toBe('GK_INJURY')
    expect(m.options.find(o => o.id === 'INJ_STAY').desc).toMatch(/12%/)
    const other = detectMoment({ minute: 20, events: [{ minute: 20, type: 'INJURY', team: 'home', playerId: 'dud', text: 'x' }], userSide: 'home', fired: new Set(), onField: field })
    expect(other.id).toBe('INJURY')
    expect(other.options.find(o => o.id === 'INJ_STAY').desc).toMatch(/4%/)
  })
})
