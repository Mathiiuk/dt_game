import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { resolveClubPattern, CREST_PATTERNS } from '../../../src/domain/clubBadges.js'
import { summarizeSquad } from '../../../src/domain/squad.js'

Given('un club con nombre {string}', function (name) {
  this.club = { name }
})

When('se resuelve el patrón de su escudo vectorial', function () {
  this.pattern = resolveClubPattern(this.club)
})

Then('el patrón heráldico asignado es {string}', function (expected) {
  assert.equal(this.pattern, CREST_PATTERNS[expected], `Se esperaba el patrón ${expected} pero se obtuvo ${this.pattern}`)
})

Given('un plantel con {int} jugadores y {int} lesionado', function (total, injured) {
  this.players = Array.from({ length: total }, (_, i) => ({
    id: `p-${i}`,
    attr_overall: 60,
    contract_salary: 500,
    is_injured: i < injured
  }))
})

When('se calcula el resumen visual del plantel', function () {
  this.summary = summarizeSquad(this.players)
})

Then('el total de jugadores es {int} y los lesionados son {int}', function (total, injured) {
  assert.equal(this.summary.total, total)
  assert.equal(this.summary.injured, injured)
})
