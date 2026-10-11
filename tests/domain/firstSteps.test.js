import { MISSION, missionProgress, showMission, nextStep } from '../../src/domain/firstSteps'

describe('misión inicial', () => {
  it('son tres pasos concretos, en orden, cada uno con su pista', () => {
    expect(MISSION.map(s => s.id)).toEqual(['tactics', 'decision', 'match'])
    for (const s of MISSION) { expect(s.title.length).toBeGreaterThan(8); expect(s.hint.length).toBeGreaterThan(20) }
  })

  it('el avance sale de lo que hizo la persona y del partido jugado', () => {
    expect(missionProgress({}, 0)).toMatchObject({ done: 0, total: 3, complete: false })
    const p = missionProgress({ tactics: true, decision: true }, 1)
    expect(p).toMatchObject({ done: 3, complete: true })
    expect(p.steps.map(s => s.done)).toEqual([true, true, true])
    expect(missionProgress({ tactics: true }, 0).steps.map(s => s.done)).toEqual([true, false, false])
    expect(missionProgress(null, undefined).done).toBe(0)
  })

  it('solo se muestra a cuentas nuevas, mientras falten pasos y no la haya ocultado', () => {
    expect(showMission({ isNew: true, dismissed: false, complete: false })).toBe(true)
    expect(showMission({ isNew: false, dismissed: false, complete: false })).toBe(false)
    expect(showMission({ isNew: true, dismissed: true, complete: false })).toBe(false)
    expect(showMission({ isNew: true, dismissed: false, complete: true })).toBe(false)
  })
})

describe('tu próximo paso', () => {
  const base = { pendingClose: false, seasonEnded: false, pendingEvents: 0, available: 18, matchDue: false, daysToMatch: 3, tacticsVisited: true, played: 4 }

  it('el cierre de temporada pendiente manda sobre todo, y después el fin de temporada', () => {
    expect(nextStep({ ...base, pendingClose: true, pendingEvents: 2 }).kind).toBe('CLOSE')
    expect(nextStep({ ...base, seasonEnded: true, pendingEvents: 2 }).kind).toBe('SEASON_END')
  })

  it('con decisiones pendientes ofrece decidir, con el plural bien', () => {
    const one = nextStep({ ...base, pendingEvents: 1 })
    expect(one).toMatchObject({ kind: 'DECISION', cta: { action: 'decide' } })
    expect(one.title).toBe('Tenés 1 decisión pendiente')
    expect(nextStep({ ...base, pendingEvents: 3 }).title).toBe('Tenés 3 decisiones pendientes')
  })

  it('si faltan jugadores aptos manda al plantel', () => {
    expect(nextStep({ ...base, available: 9 })).toMatchObject({ kind: 'SQUAD', cta: { to: '/squad' } })
  })

  it('el día del partido: jugar; y el primero, con la táctica sin mirar, pasa por la pizarra', () => {
    expect(nextStep({ ...base, matchDue: true })).toMatchObject({ kind: 'PLAY' })
    expect(nextStep({ ...base, matchDue: true }).cta).toBeUndefined()
    expect(nextStep({ ...base, matchDue: true, tacticsVisited: false, played: 0 })).toMatchObject({ kind: 'TACTICS', cta: { to: '/tactics' } })
    expect(nextStep({ ...base, matchDue: true, tacticsVisited: false, played: 3 }).kind).toBe('PLAY')
  })

  it('sin partido a la vista: entrenar y avanzar, con los días que faltan', () => {
    expect(nextStep({ ...base, daysToMatch: 1 }).body).toMatch(/mañana/i)
    expect(nextStep({ ...base, daysToMatch: 4 })).toMatchObject({ kind: 'ADVANCE' })
    expect(nextStep({ ...base, daysToMatch: 4 }).body).toMatch(/4 días/)
    expect(nextStep({ ...base, hasFixture: false, daysToMatch: 0 }).kind).toBe('ADVANCE')
  })
})
