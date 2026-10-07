import { matchAttendance, gateFromAttendance } from '../../src/domain/attendance'

// Los valores salen de settle_gate en la base: si cambia una fórmula, tiene que cambiar la otra
describe('asistencia a la cancha', () => {
  const base = { loyal: 350, casual: 2500, support: 60, price: 10, isDerby: false, recentWins: 2, capacity: 5000 }

  it('socios 350, potencial casual 2.500, apoyo 60, entrada a 10, dos victorias recientes, estadio de 5.000', () => {
    expect(matchAttendance(base)).toEqual({ attendance: 1940, totalDemand: 1940, fillPct: 38.8 })
  })
  it('entrada a 18 con una racha de 99 victorias (se acota a 5): 1.111 personas, igual que en la base', () => {
    expect(matchAttendance({ ...base, price: 18, recentWins: 99 }).attendance).toBe(1111)
  })
  it('una entrada cara espanta a la gente (elasticidad del precio)', () => {
        expect(matchAttendance({ ...base, price: 18 }).attendance).toBeLessThan(matchAttendance(base).attendance)
  })
  it('nunca baja de los socios fieles ni supera la capacidad', () => {
    expect(matchAttendance({ ...base, support: 0, price: 18, recentWins: 0 }).attendance).toBeGreaterThanOrEqual(350)
    expect(matchAttendance({ ...base, capacity: 800 }).attendance).toBe(800)
  })
  it('un clásico suma gente', () => {
    const calm = matchAttendance({ ...base, support: 40 })
    const derby = matchAttendance({ ...base, support: 40, isDerby: true })
    expect(derby.attendance).toBeGreaterThan(calm.attendance)
  })
  it('las victorias recientes se acotan a 5 (el navegador no puede inventar rachas)', () => {
    expect(matchAttendance({ ...base, capacity: 9000, recentWins: 99 })).toEqual(matchAttendance({ ...base, capacity: 9000, recentWins: 5 }))
  })
})

describe('liquidación de taquilla', () => {
  it('el 40% se va en seguridad, árbitros y logística', () => {
    expect(gateFromAttendance(1500, 10)).toEqual({ gross: 15000, operating: 6000, net: 9000 })
    expect(gateFromAttendance(800, 8)).toEqual({ gross: 6400, operating: 2560, net: 3840 })
  })
})
