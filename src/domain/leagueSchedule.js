// Calendario de liga: todos contra todos, ida y vuelta (2 * (n - 1) fechas) o solo ida con `{ legs: 1 }`, con la localía repartida parejo.
// Método del círculo: un club queda fijo y el resto rota; la localía se alterna para que ningún club juegue casi todo de visitante.
// En la segunda rueda, se invierten las localías exactas de la primera rueda.
export function roundRobinSchedule(clubIds, { legs = 2 } = {}) {
  const teams = [...(clubIds || [])]
  if (teams.length < 2) return []
  if (teams.length % 2 === 1) teams.push(null) // descanso
  const n = teams.length
  const fixed = teams[n - 1]
  const rotating = teams.slice(0, n - 1)
  
  // Balance de localía por club
  const home = new Map(teams.map(t => [t, 0]))
  const away = new Map(teams.map(t => [t, 0]))
  const awayRun = new Map(teams.map(t => [t, 0]))

  const primeraRueda = []
  for (let r = 0; r < n - 1; r++) {
    const ring = [...rotating.slice(r), ...rotating.slice(0, r)]
    const matches = []
    for (let k = 0; k < n / 2; k++) {
      const a = k === 0 ? fixed : ring[k - 1]
      const b = ring[n - 2 - k]
      if (a === null || b === null) continue
      const debt = (t) => (away.get(t) - home.get(t)) * 10 + awayRun.get(t)
      const aHome = debt(a) > debt(b) || (debt(a) === debt(b) && (r + k) % 2 === 0)
      const m = aHome ? { home: a, away: b } : { home: b, away: a }
      home.set(m.home, home.get(m.home) + 1); awayRun.set(m.home, 0)
      away.set(m.away, away.get(m.away) + 1); awayRun.set(m.away, awayRun.get(m.away) + 1)
      matches.push(m)
    }
    primeraRueda.push(matches)
  }

  // Segunda Rueda (Vuelta): se invierten las localías de la primera rueda
  const segundaRueda = primeraRueda.map(round => 
    round.map(m => ({ home: m.away, away: m.home }))
  )

  return legs === 1 ? primeraRueda : [...primeraRueda, ...segundaRueda]
}
