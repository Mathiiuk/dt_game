import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { signingsSummary, decisionRanking } from '../../../src/domain/yearInReview.js'

Given('el club compró 2 jugadores por {int} y {int} y vendió 1 por {int}', function (a, b, venta) {
  this.transfers = [
    { from_club_id: 'x', to_club_id: 'me', transfer_fee: a, player_id: 'p1' },
    { from_club_id: 'y', to_club_id: 'me', transfer_fee: b, player_id: 'p2' },
    { from_club_id: 'me', to_club_id: 'z', transfer_fee: venta, player_id: 'p3' }
  ]
})

Given('el club no hizo ninguna operación', function () {
  this.transfers = []
})

When('se arma el resumen de fichajes', function () {
  this.signings = signingsSummary(this.transfers, 'me')
})

Then('se informa que compró {int} gastando {int} y vendió {int} ingresando {int}', function (bought, spent, sold, earned) {
  assert.deepEqual({ bought: this.signings.bought, spent: this.signings.spent, sold: this.signings.sold, earned: this.signings.earned }, { bought, spent, sold, earned })
})

Given('la decisión {string} tuvo un impacto total de {int}', function (message, impacto) {
  this.logs = [{ message, fans: impacto, board: 0, locker: 0 }, { message: 'Neutra', fans: 0, board: 0, locker: 0 }]
})

When('se arma el ranking de decisiones', function () {
  this.ranking = decisionRanking(this.logs)
})

Then('la mejor decisión es {string}', function (message) {
  assert.equal(this.ranking.best?.message, message)
})

Then('la peor decisión es {string}', function (message) {
  assert.equal(this.ranking.worst?.message, message)
})
