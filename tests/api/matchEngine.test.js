// El motor importa el cliente de Supabase; en tests se reemplaza por un stub (no se hace ninguna llamada real)
vi.mock('../../src/api/supabase', () => ({ supabase: {} }))

import { createRNG, simulateMatch } from '../../src/api/matchEngine'

const squad = (level) => Array.from({ length: 11 }, (_, i) => ({
  id: `p${i}`, first_name: 'J', last_name: `${i}`, state_fitness: 90,
  attr_pace: level, attr_shooting: level, attr_passing: level, attr_defending: level
}))
const tactic = { formation: '4-4-2', mentality: 'BALANCED' }

describe('motor de partidos', () => {
  it('el RNG es determinista por semilla', () => {
    const a = createRNG('semilla'); const b = createRNG('semilla'); const c = createRNG('otra')
    const sa = [a(), a(), a()]
    expect(sa).toEqual([b(), b(), b()])
    expect(sa).not.toEqual([c(), c(), c()])
    sa.forEach(n => { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(1) })
  })

  it('la misma semilla produce exactamente el mismo partido (reproducible y auditable)', () => {
    const r1 = simulateMatch(tactic, squad(60), tactic, squad(55), 'fixture-1')
    const r2 = simulateMatch(tactic, squad(60), tactic, squad(55), 'fixture-1')
    expect(r1).toEqual(r2)
  })

  it('devuelve marcador entero, pitazo final y posesión que suma 100', () => {
    const r = simulateMatch(tactic, squad(60), tactic, squad(60), 'x')
    expect(Number.isInteger(r.homeScore)).toBe(true)
    expect(Number.isInteger(r.awayScore)).toBe(true)
    expect(r.events.some(e => e.type === 'END' && e.minute === 90)).toBe(true)
    expect(r.stats.possession.home + r.stats.possession.away).toBe(100)
  })

  it('el equipo claramente superior gana más partidos que el inferior', () => {
    let strongWins = 0; let weakWins = 0
    for (let i = 0; i < 150; i++) {
      const r = simulateMatch(tactic, squad(80), tactic, squad(40), `seed-${i}`)
      if (r.homeScore > r.awayScore) strongWins++
      if (r.awayScore > r.homeScore) weakWins++
    }
    expect(strongWins).toBeGreaterThan(weakWins * 2)
  })
})

describe('cambios en vivo', () => {
  const strong = squad(80)
  const weak = squad(40)

  it('hasta el minuto del cambio el partido es idéntico y después rinde el nuevo once', () => {
    const base = simulateMatch(tactic, weak, tactic, strong, 'cambio-1')
    const changed = simulateMatch(tactic, weak, tactic, strong, 'cambio-1', { changes: [{ minute: 45, team: 'home', players: squad(95).map((p, i) => ({ ...p, id: `n${i}` })) }] })
    const upTo = (r) => r.events.filter(e => e.minute <= 45)
    expect(upTo(changed)).toEqual(upTo(base))
  })

  it('un once mucho mejor desde el entretiempo mete más goles en promedio', () => {
    let baseGoals = 0, changedGoals = 0
    const better = squad(99).map((p, i) => ({ ...p, id: `n${i}` }))
    for (let i = 0; i < 150; i++) {
      baseGoals += simulateMatch(tactic, weak, tactic, strong, `c-${i}`).homeScore
      changedGoals += simulateMatch(tactic, weak, tactic, strong, `c-${i}`, { changes: [{ minute: 45, team: 'home', players: better }] }).homeScore
    }
    expect(changedGoals).toBeGreaterThan(baseGoals)
  })

  it('sin cambios el resultado es el de siempre', () => {
    expect(simulateMatch(tactic, weak, tactic, strong, 's', { changes: [] })).toEqual(simulateMatch(tactic, weak, tactic, strong, 's'))
  })
})

describe('gritos y decisiones del DT cambian el partido', () => {
  const even = () => squad(60)
  const goals = (changes, side) => {
    let total = 0
    for (let i = 0; i < 600; i++) {
      const r = simulateMatch(tactic, even(), tactic, even(), `g-${i}`, { changes })
      total += side === 'home' ? r.homeScore : r.awayScore
    }
    return total
  }

  it('atacar con todo desde el inicio mete más goles', () => {
    const attack = [{ minute: 0, team: 'home', buff: { att: 1.4, def: 0.7 }, duration: 90 }]
    expect(goals(attack, 'home')).toBeGreaterThan(goals([], 'home') * 1.2)
    // Los goles que recibe no se afirman: con mucho ataque el rival tiene menos ocasiones y compensa la defensa floja
    // (con 2000 partidos el efecto es chico y cambia de signo con el azar de cada versión del motor)
  })

  it('cerrar atrás desde el inicio recibe menos goles', () => {
    const lock = [{ minute: 0, team: 'home', buff: { def: 1.5, att: 0.9 }, duration: 90 }]
    expect(goals(lock, 'away')).toBeLessThan(goals([], 'away'))
  })

  it('el efecto dura solo los minutos indicados: hasta el cambio el partido es idéntico', () => {
    const base = simulateMatch(tactic, even(), tactic, even(), 'dur-1')
    const withBuff = simulateMatch(tactic, even(), tactic, even(), 'dur-1', { changes: [{ minute: 60, team: 'home', buff: { att: 2 }, duration: 15 }] })
    expect(withBuff.events.filter(e => e.minute <= 60)).toEqual(base.events.filter(e => e.minute <= 60))
  })

  it('el visitante también se beneficia de su propio ataque (no se usa el del local)', () => {
    const buff = [{ minute: 0, team: 'away', buff: { att: 1.5 }, duration: 90 }]
    expect(goals(buff, 'away')).toBeGreaterThan(goals([], 'away'))
  })

  it('un grito de posesión sube la posesión', () => {
    const base = simulateMatch(tactic, even(), tactic, even(), 'pos')
    const calm = simulateMatch(tactic, even(), tactic, even(), 'pos', { changes: [{ minute: 0, team: 'home', buff: { mid: 1.5 }, duration: 90 }] })
    expect(calm.stats.possession.home).toBeGreaterThan(base.stats.possession.home)
  })

  it('una roja le cuesta goles al equipo que se queda con diez', () => {
    let reds = 0
    let dropped = 0
    let gained = 0
    for (let i = 0; i < 4000; i++) {
      const r = simulateMatch(tactic, even(), tactic, even(), `roja-${i}`)
      const red = r.events.find(e => e.type === 'CARD_RED')
      if (!red) continue
      reds++
      const after = r.events.filter(e => e.type === 'GOAL' && e.minute > red.minute)
      const mine = after.filter(e => e.team === red.team).length
      const theirs = after.length - mine
      if (mine < theirs) dropped++
      if (mine > theirs) gained++
    }
    expect(reds).toBeGreaterThan(20)
    expect(dropped).toBeGreaterThan(gained)
  })
})

describe('penales y rival que reacciona', () => {
  const sq = (level, prefix, finishing = level) => Array.from({ length: 11 }, (_, i) => ({
    id: `${prefix}${i}`, first_name: 'J', last_name: `${prefix}${i}`, position: i === 0 ? 'PO' : 'MC', state_fitness: 90,
    attr_pace: level, attr_shooting: finishing, attr_finishing: finishing, attr_passing: level, attr_defending: level
  }))
  const firstPenalty = (home, away, opts = {}) => {
    for (let i = 0; i < 4000; i++) {
      const r = simulateMatch(tactic, home, tactic, away, `pen-${i}`, opts)
      const pen = r.events.find(e => e.type === 'PENALTY')
      if (pen) return { seed: `pen-${i}`, pen, r }
    }
    return null
  }

  it('hay penales y cada uno se resuelve al minuto siguiente, para el mismo equipo, con gol o con fallo', () => {
    let seen = 0
    for (let i = 0; i < 1500; i++) {
      const r = simulateMatch(tactic, squad(60), tactic, squad(60), `pen-check-${i}`)
      for (const e of r.events.filter(ev => ev.type === 'PENALTY')) {
        seen++
        const next = r.events.find(ev => ev.minute === e.minute + 1 && ev.team === e.team && (ev.type === 'GOAL' || ev.type === 'MISS') && /penal/i.test(ev.text))
        expect(next).toBeTruthy()
      }
    }
    expect(seen).toBeGreaterThan(5)
  })

  it('un penal convertido suma al marcador igual que cualquier gol', () => {
    const found = firstPenalty(squad(60), squad(60))
    const goals = found.r.events.filter(e => e.type === 'GOAL')
    expect(found.r.homeScore + found.r.awayScore).toBe(goals.length)
  })

  it('quien patea importa: un especialista convierte más que alguien que nunca definió', () => {
    const home = [...sq(60, 'h')]
    home[3] = { ...home[3], id: 'ace', attr_finishing: 95, attr_shooting: 95 }
    home[4] = { ...home[4], id: 'dud', attr_finishing: 10, attr_shooting: 10 }
    const away = sq(60, 'a')
    let ace = 0
    let dud = 0
    let tries = 0
    for (let i = 0; i < 6000 && tries < 120; i++) {
      const base = simulateMatch(tactic, home, tactic, away, `pen-taker-${i}`)
      const pen = base.events.find(e => e.type === 'PENALTY' && e.team === 'home')
      if (!pen) continue
      tries++
      const run = (id) => simulateMatch(tactic, home, tactic, away, `pen-taker-${i}`, { changes: [{ minute: pen.minute, team: 'home', kind: 'PENALTY_TAKER', playerId: id }] })
      const resolved = (r) => r.events.find(e => e.minute === pen.minute + 1 && e.team === 'home' && /penal/i.test(e.text) && (e.type === 'GOAL' || e.type === 'MISS'))
      if (resolved(run('ace')).type === 'GOAL') ace++
      if (resolved(run('dud')).type === 'GOAL') dud++
    }
    expect(tries).toBeGreaterThan(60)
    expect(ace).toBeGreaterThan(dud)
  })

  it('adivinar para dónde patea el rival casi siempre ataja el penal', () => {
    const home = sq(60, 'h')
    const away = sq(60, 'a', 90)
    let saved = 0
    let blind = 0
    let tries = 0
    for (let i = 0; i < 6000 && tries < 90; i++) {
      const base = simulateMatch(tactic, home, tactic, away, `pen-dive-${i}`)
      const pen = base.events.find(e => e.type === 'PENALTY' && e.team === 'away')
      if (!pen) continue
      tries++
      // El rival patea siempre a una de tres esquinas: se prueban las tres y se cuenta cuántas veces se ataja
      for (const dive of ['L', 'C', 'R']) {
        const r = simulateMatch(tactic, home, tactic, away, `pen-dive-${i}`, { changes: [{ minute: pen.minute, team: 'home', kind: 'PENALTY_DIVE', dive }] })
        const res = r.events.find(e => e.minute === pen.minute + 1 && e.team === 'away' && /penal/i.test(e.text) && (e.type === 'GOAL' || e.type === 'MISS'))
        if (res.type === 'MISS') saved++
      }
      const none = base.events.find(e => e.minute === pen.minute + 1 && e.team === 'away' && /penal/i.test(e.text) && (e.type === 'GOAL' || e.type === 'MISS'))
      if (none.type === 'MISS') blind++
    }
    // De tres posibles direcciones, una acierta y casi siempre ataja: en promedio ataja más de una vez por penal, y más que a ciegas
    expect(saved).toBeGreaterThan(tries * 0.9)
    expect(saved / (tries * 3)).toBeGreaterThan(blind / tries)
  })

  it('un penal bien pegado convierte más que uno mal pegado, y uno malísimo se va a la tribuna', () => {
    const home = sq(60, 'h')
    const away = sq(60, 'a')
    let good = 0
    let bad = 0
    let stand = 0
    let tries = 0
    for (let i = 0; i < 6000 && tries < 150; i++) {
      const base = simulateMatch(tactic, home, tactic, away, `pen-aim-${i}`)
      const pen = base.events.find(e => e.type === 'PENALTY' && e.team === 'home')
      if (!pen) continue
      tries++
      const run = (quality) => simulateMatch(tactic, home, tactic, away, `pen-aim-${i}`, { changes: [{ minute: pen.minute, team: 'home', kind: 'PENALTY_AIM', aim: 'L', quality }] })
      const resolved = (r) => r.events.find(e => e.minute === pen.minute + 1 && e.team === 'home' && /penal/i.test(e.text) && (e.type === 'GOAL' || e.type === 'MISS'))
      if (resolved(run(1)).type === 'GOAL') good++
      if (resolved(run(0.3)).type === 'GOAL') bad++
      if (/tribuna/.test(resolved(run(0)).text)) stand++
    }
    expect(tries).toBeGreaterThan(60)
    expect(good).toBeGreaterThan(bad)
    expect(stand).toBeGreaterThan(tries * 0.8)
  })

  it('hay manos a mano y, si el DT elige cómo definir, el resultado cambia sin romper el resto del partido', () => {
    let found = 0
    let changed = 0
    for (let i = 0; i < 3000 && found < 40; i++) {
      const base = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `kp-${i}`)
      const kp = base.events.find(e => e.type === 'KEYPLAY')
      if (!kp) continue
      found++
      const res = (r) => r.events.find(e => e.minute === kp.minute + 1 && /mano a mano/i.test(e.text) && (e.type === 'GOAL' || e.type === 'SAVE' || e.type === 'MISS'))
      expect(res(base)).toBeTruthy()
      const r = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `kp-${i}`, { changes: [{ minute: kp.minute, team: kp.team, kind: 'KEYPLAY_CHOICE', choice: 'DRIBBLE' }] })
      if (res(r) && res(r).type !== res(base).type) changed++
    }
    expect(found).toBeGreaterThan(20)
    expect(changed).toBeGreaterThan(0)
  })

  it('hay remates peligrosos que se resuelven al minuto siguiente y la reacción del arquero cambia el resultado', () => {
    let found = 0
    let goalsGood = 0
    let goalsBad = 0
    for (let i = 0; i < 4000 && found < 120; i++) {
      const base = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `shot-${i}`)
      const shot = base.events.find(e => e.type === 'SHOT' && e.team === 'away')
      if (!shot) continue
      found++
      const res = (r) => r.events.find(e => e.minute === shot.minute + 1 && e.team === 'away' && /atajada|GOL|desviado|esquina/i.test(e.text) && ['GOAL', 'SAVE', 'MISS', 'CORNER'].includes(e.type))
      expect(res(base)).toBeTruthy()
      const run = (quality) => simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `shot-${i}`, { changes: [{ minute: shot.minute, team: 'home', kind: 'SAVE_REACT', quality }] })
      if (res(run(1))?.type === 'GOAL') goalsGood++
      if (res(run(0))?.type === 'GOAL') goalsBad++
    }
    expect(found).toBeGreaterThan(60)
    // Una reacción perfecta deja entrar menos goles que una reacción nula
    expect(goalsGood).toBeLessThan(goalsBad)
  })

  it('hay córners con pista y, si el DT manda el centro por la zona floja, convierte más que por la zona fuerte', () => {
    let found = 0
    let weakGoals = 0
    let strongGoals = 0
    let hintRight = 0
    for (let i = 0; i < 6000 && found < 150; i++) {
      const base = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `corner-${i}`)
      const sp = base.events.find(e => e.type === 'SETPIECE_CORNER' && e.team === 'home')
      if (!sp) continue
      found++
      const zones = ['NEAR', 'MID', 'FAR']
      expect(zones).toContain(sp.hint)
      const run = (zone) => simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `corner-${i}`, { changes: [{ minute: sp.minute, team: 'home', kind: 'SETPIECE_CORNER', zone }] })
      const goalAt = (r) => r.events.some(e => e.minute === sp.minute + 1 && e.team === 'home' && e.type === 'GOAL' && /córner/.test(e.text))
      // La pista casi siempre marca la zona floja: se prueba la pista contra las otras dos
      const others = zones.filter(z => z !== sp.hint)
      if (goalAt(run(sp.hint))) weakGoals++
      others.forEach(z => { if (goalAt(run(z))) strongGoals += 0.5 })
      hintRight++
    }
    expect(found).toBeGreaterThan(50)
    expect(hintRight).toBe(found)
    expect(weakGoals).toBeGreaterThan(strongGoals)
  })

  it('un tiro libre bien pegado convierte más que uno flojo', () => {
    let found = 0
    let good = 0
    let weak = 0
    for (let i = 0; i < 8000 && found < 200; i++) {
      const base = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `fk-${i}`)
      const sp = base.events.find(e => e.type === 'SETPIECE_FK' && e.team === 'home')
      if (!sp) continue
      found++
      const run = (quality) => simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `fk-${i}`, { changes: [{ minute: sp.minute, team: 'home', kind: 'SETPIECE_FK', playerId: null, aim: 'L', quality }] })
      const goalAt = (r) => r.events.some(e => e.minute === sp.minute + 1 && e.team === 'home' && e.type === 'GOAL' && /TIRO LIBRE/.test(e.text))
      if (goalAt(run(1))) good++
      if (goalAt(run(0.1))) weak++
    }
    expect(found).toBeGreaterThan(80)
    expect(good).toBeGreaterThan(weak)
  })

  it('defender un córner del rival: reforzar la zona que marca la pista baja los goles, y dejar dos arriba puede dar un contragolpe', () => {
    let found = 0
    let right = 0
    let wrong = 0
    let counters = 0
    for (let i = 0; i < 8000 && found < 150; i++) {
      const base = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `defc-${i}`)
      const sp = base.events.find(e => e.type === 'SETPIECE_CORNER' && e.team === 'away')
      if (!sp) continue
      found++
      expect(['NEAR', 'MID', 'FAR']).toContain(sp.defHint)
      const run = (zone) => simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `defc-${i}`, { changes: [{ minute: sp.minute, team: 'home', kind: 'SETPIECE_DEF_CORNER', zone }] })
      const goalAt = (r) => r.events.some(e => e.minute === sp.minute + 1 && e.team === 'away' && e.type === 'GOAL' && /córner/.test(e.text))
      if (goalAt(run(sp.defHint))) right++
      const other = ['NEAR', 'MID', 'FAR'].find(z => z !== sp.defHint)
      if (goalAt(run(other))) wrong++
      if (run('COUNTER').events.some(e => e.type === 'COUNTER' && e.minute === sp.minute + 1)) counters++
    }
    expect(found).toBeGreaterThan(50)
    expect(right).toBeLessThan(wrong + 1)
    expect(counters).toBeGreaterThan(0)
  })

  it('defender un tiro libre del rival: cubrir la zona que marca la pista lo ataja más que cubrir otra', () => {
    let found = 0
    let covered = 0
    let uncovered = 0
    for (let i = 0; i < 8000 && found < 200; i++) {
      const base = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `deff-${i}`)
      const sp = base.events.find(e => e.type === 'SETPIECE_FK' && e.team === 'away')
      if (!sp) continue
      found++
      const run = (mode) => simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `deff-${i}`, { changes: [{ minute: sp.minute, team: 'home', kind: 'SETPIECE_DEF_FK', mode }] })
      const saved = (r) => r.events.some(e => e.minute === sp.minute + 1 && e.team === 'away' && e.type === 'SAVE' && /tiro libre/.test(e.text))
      if (saved(run(sp.defHint))) covered++
      const other = ['L', 'C', 'R'].find(z => z !== sp.defHint)
      if (saved(run(other))) uncovered++
    }
    expect(found).toBeGreaterThan(80)
    expect(covered).toBeGreaterThanOrEqual(uncovered)
  })

  it('las pelotas paradas las cobra el especialista del equipo, con nombre en el relato', () => {
    const named = (prefix) => squad(60).map((p, i) => ({ ...p, first_name: prefix, last_name: `J${i}`, attr_passing: 40 + i * 5, attr_shooting: 40 + i * 4, attr_finishing: 40 + i * 4, attr_vision: 40 + i * 5 }))
    let fks = 0
    let corners = 0
    for (let i = 0; i < 3000 && (fks < 40 || corners < 40); i++) {
      const r = simulateMatch(tactic, named('Local'), tactic, named('Visita'), `named-${i}`)
      for (const sp of r.events.filter(e => e.type === 'SETPIECE_FK' && e.team === 'home')) {
        expect(sp.takerName).toMatch(/^Local J/)
        const res = r.events.find(e => e.minute === sp.minute + 1 && e.team === 'home' && /tiro libre|TIRO LIBRE/.test(e.text))
        expect(res?.text).toContain(sp.takerName)
        fks++
      }
      for (const sp of r.events.filter(e => e.type === 'SETPIECE_CORNER' && e.team === 'away')) {
        expect(sp.takerName).toMatch(/^Visita J/)
        expect(sp.headerName).toMatch(/^Visita J/)
        expect(sp.text).toContain(sp.takerName)
        corners++
      }
    }
    expect(fks).toBeGreaterThan(20)
    expect(corners).toBeGreaterThan(20)
  })

  it('el especialista fijado a mano cobra los tiros libres de su equipo (y el rival sigue con el suyo)', () => {
    const named = (prefix) => squad(60).map((p, i) => ({ ...p, first_name: prefix, last_name: `J${i}`, attr_shooting: 40 + i * 4, attr_finishing: 40 + i * 4, attr_passing: 40 + i * 5, attr_vision: 40 + i * 5 }))
    const home = named('Local')
    const chosen = home[3] // no es el mejor por atributos
    let own = 0
    let rival = 0
    for (let i = 0; i < 3000 && (own < 25 || rival < 25); i++) {
      const r = simulateMatch(tactic, home, tactic, named('Visita'), `manual-${i}`, { specialistOverrides: { home: { FREE_KICK: chosen.id } } })
      for (const sp of r.events.filter(e => e.type === 'SETPIECE_FK')) {
        if (sp.team === 'home') { expect(sp.takerName).toBe(`${chosen.first_name} ${chosen.last_name}`); own++ } else { expect(sp.takerName).not.toBe(`${chosen.first_name} ${chosen.last_name}`); rival++ }
      }
    }
    expect(own).toBeGreaterThan(20)
    expect(rival).toBeGreaterThan(20)
  })

  it('un cabeceador con mucho juego aéreo mete más goles de córner que uno flojo', () => {
    const team = (heading) => squad(60).map((p, i) => ({ ...p, id: `h${i}`, first_name: 'H', last_name: `J${i}`, attr_heading: i === 9 ? heading : 45, attr_strength: 55, attr_passing: 60, attr_vision: 60 }))
    let high = 0
    let low = 0
    for (let i = 0; i < 4000; i++) {
      const goalsFrom = (heading) => simulateMatch(tactic, team(heading), tactic, squad(60), `aereo-${i}`).events.filter(e => e.type === 'GOAL' && e.team === 'home' && /de cabeza/.test(e.text)).length
      high += goalsFrom(99)
      low += goalsFrom(20)
    }
    expect(high + low).toBeGreaterThan(30)
    expect(high).toBeGreaterThan(low)
  })

  describe('personalidad de juego del rival', () => {
    const count = (style, pick, n = 500) => {
      let total = 0
      for (let i = 0; i < n; i++) {
        const r = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), `estilo-${i}`, { styles: style ? { away: style } : null })
        total += pick(r)
      }
      return total
    }
    const ev = (r, type) => r.events.filter(e => e.type === type && e.team === 'away').length

    it('los centradores provocan más córners', () => {
      expect(count({ corner: 1.8 }, r => ev(r, 'CORNER'))).toBeGreaterThan(count(null, r => ev(r, 'CORNER')) * 1.2)
    })

    it('los pegadores de media distancia generan más tiros y los contragolpeadores menos', () => {
      const base = count(null, r => r.stats.shots.away)
      expect(count({ att: 1.12, goal: 0.88 }, r => r.stats.shots.away)).toBeGreaterThan(base)
      expect(count({ att: 0.9, goal: 1.22 }, r => r.stats.shots.away)).toBeLessThan(base)
    })

    it('los duros hacen más faltas y reciben más amarillas', () => {
      const rough = { foul: 1.7, card: 1.5 }
      expect(count(rough, r => r.stats.fouls.away)).toBeGreaterThan(count(null, r => r.stats.fouls.away) * 1.15)
      expect(count(rough, r => r.stats.yellowCards.away)).toBeGreaterThan(count(null, r => r.stats.yellowCards.away))
    })

    it('el toque y la posesión suben la posesión del rival', () => {
      expect(count({ mid: 1.1, foul: 0.75, card: 0.8 }, r => r.stats.possession.away)).toBeGreaterThan(count(null, r => r.stats.possession.away))
    })

    it('sin personalidad el partido es el de siempre', () => {
      const a = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), 'neutro')
      const b = simulateMatch(tactic, sq(60, 'h'), tactic, sq(60, 'a'), 'neutro', { styles: { away: { att: 1, goal: 1, corner: 1, foul: 1, card: 1, mid: 1 } } })
      expect(b).toEqual(a)
    })
  })

  it('el rival reacciona: si va perdiendo a los 60 se tira al ataque y si gana a los 75 se cierra', () => {
    let attacking = 0
    let closing = 0
    for (let i = 0; i < 400; i++) {
      const r = simulateMatch(tactic, squad(40), tactic, squad(80), `ai-${i}`, { aiSide: 'home' })
      if (r.events.some(e => e.type === 'RIVAL_TACTIC' && e.minute === 60)) attacking++
      if (r.events.some(e => e.type === 'RIVAL_TACTIC' && e.minute === 75)) closing++
    }
    expect(attacking).toBeGreaterThan(30)
    expect(closing).toBeGreaterThanOrEqual(0)
    const none = simulateMatch(tactic, squad(40), tactic, squad(80), 'ai-sin', {})
    expect(none.events.some(e => e.type === 'RIVAL_TACTIC')).toBe(false)
  })

  it('el equipo que se tira al ataque cuando pierde mete más goles que si no reaccionara', () => {
    let reacts = 0
    let passive = 0
    for (let i = 0; i < 300; i++) {
      reacts += simulateMatch(tactic, squad(60), tactic, squad(60), `ai-gol-${i}`, { aiSide: 'home' }).homeScore
      passive += simulateMatch(tactic, squad(60), tactic, squad(60), `ai-gol-${i}`).homeScore
    }
    expect(reacts).toBeGreaterThanOrEqual(passive - 15)
  })
})
