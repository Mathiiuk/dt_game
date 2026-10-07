import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { roundRobinSchedule } from '../../../src/domain/leagueSchedule.js'
import { isSeasonEnded } from '../../../src/domain/gameWeek.js'

Given('una liga de {int} clubes', function (n) {
  this.clubs = Array.from({ length: n }, (_, i) => `c${i}`)
})

When('se arma el calendario', function () {
  this.rounds = roundRobinSchedule(this.clubs)
})

Then('hay {int} fechas de {int} partidos', function (fechas, partidos) {
  assert.equal(this.rounds.length, fechas)
  assert.ok(this.rounds.every(r => r.length === partidos))
})

Then('cada club juega entre {int} y {int} partidos de local', function (min, max) {
  const home = {}
  for (const r of this.rounds) for (const m of r) home[m.home] = (home[m.home] || 0) + 1
  for (const c of this.clubs) assert.ok(home[c] >= min && home[c] <= max, `${c} juega ${home[c]} de local`)
})

Then('ningún club juega más de {int} fechas seguidas de visitante', function (max) {
  for (const c of this.clubs) {
    let run = 0
    for (const r of this.rounds) {
      const m = r.find(x => x.home === c || x.away === c)
      run = m.away === c ? run + 1 : 0
      assert.ok(run <= max, `${c} juega ${run} seguidas de visitante`)
    }
  }
})

Then('cada par de clubes se cruza exactamente una vez', function () {
  const seen = new Set()
  for (const r of this.rounds) for (const m of r) {
    const key = [m.home, m.away].sort().join('|')
    assert.ok(!seen.has(key), `repetido ${key}`)
    seen.add(key)
  }
  assert.equal(seen.size, (this.clubs.length * (this.clubs.length - 1)) / 2)
})

Given('la fecha del juego es {word}', function (fecha) {
  this.fecha = fecha
})

Then('la temporada {word}', function (estado) {
  assert.equal(isSeasonEnded(this.fecha), estado === 'terminó')
})
