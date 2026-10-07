import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { scoutInsights } from '../../../src/domain/scoutInsights.js'

Given('mi mejor DC tiene nivel {int}', function (nivel) {
  this.squad = [{ position: 'DC', attr_overall: nivel }, { position: 'DC', attr_overall: nivel - 7 }]
})

When('ojeo a un {word} de nivel {int}', function (puesto, nivel) {
  this.lines = scoutInsights({ player: { position: puesto, attr_overall: nivel, age: 26 }, squad: this.squad, price: 0 })
})

Then('la lectura dice {string}', function (frase) {
  assert.ok(this.lines.some(l => l.text.includes(frase)), `Ninguna línea incluye "${frase}": ${JSON.stringify(this.lines)}`)
})

Given('no hay jugador para ojear', function () {
  this.lines = scoutInsights({ player: null })
})

Then('no hay lectura', function () {
  assert.deepEqual(this.lines, [])
})
