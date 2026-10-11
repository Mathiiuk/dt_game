import { roundRobinSchedule } from '../../src/domain/leagueSchedule'
import { weeklyBudget, gateSettlement } from '../../src/domain/finances'

const ids = (n) => Array.from({ length: n }, (_, i) => `c${i}`)

// Un club con pocos partidos de local no tiene taquilla y pierde plata cada semana: el calendario tiene que repartir la localía.
describe('localía balanceada en el calendario', () => {
  it.each([
    ['en orden', ids(20)],
    ['al revés', ids(20).reverse()],
    ['con el club del usuario primero', ['me', ...ids(19)]]
  ])('20 clubes %s: cada uno juega 9 o 10 de local por rueda y nunca más de 3 de visitante seguidos', (_, clubs) => {
    const rounds = roundRobinSchedule(clubs)
    for (const club of clubs) {
      const first = rounds.slice(0, 19).flat().filter(m => m.home === club).length
      const second = rounds.slice(19).flat().filter(m => m.home === club).length
      expect(first, club).toBeGreaterThanOrEqual(9)
      expect(first, club).toBeLessThanOrEqual(10)
      expect(first + second, club).toBe(19)
      let away = 0
      for (const r of rounds) {
        const m = r.find(x => x.home === club || x.away === club)
        if (!m) continue
        away = m.away === club ? away + 1 : 0
        expect(away, club).toBeLessThanOrEqual(3)
      }
    }
  })

  it('con 19 clubes (descanso) y solo ida también se reparte parejo', () => {
    const clubs = ids(19)
    const rounds = roundRobinSchedule(clubs, { legs: 1 })
    for (const club of clubs) {
      const home = rounds.flat().filter(m => m.home === club).length
      expect(home, club).toBeGreaterThanOrEqual(8)
      expect(home, club).toBeLessThanOrEqual(10)
    }
  })
})

describe('el club inicial no se funde mientras juegue de local', () => {
  const club = { reputation: 15, stadium_level: 1, academy_level: 1, store_level: 1, league_tier: 5 }
  const players = Array.from({ length: 20 }, () => ({ contract_salary: 120 }))

  it('sin taquilla la semana es deficitaria: por eso importa la localía', () => {
    const { net } = weeklyBudget({ club, players, staff: [] })
    expect(net).toBeLessThan(0)
  })

  it('con la mitad de los partidos de local, la temporada deja plata con el estadio inicial lleno', () => {
    const { net } = weeklyBudget({ club, players, staff: [] })
    const gate = gateSettlement(1500, 10).net // estadio inicial lleno, entrada de $10 (lo que liquidó la base: $9.000 netos)
    // cada 2 semanas: 1 partido de local (taquilla neta) y 2 semanas de gastos fijos
    const perTwoWeeks = net * 2 + gate
    expect(perTwoWeeks).toBeGreaterThan(0)
  })
})
