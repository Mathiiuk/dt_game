import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { pickRivalClubs } from '../../../src/domain/rivalClubs.js'

Given('una categoría de juego de nivel {int}', function (tier) {
  this.tier = tier
})

When('se sortean {int} rivales para la carrera {string}', function (count, seed) {
  this.rivals = pickRivalClubs(seed, count, { tier: this.tier })
})

Then('todos los rivales pertenecen a la categoría {int}', function (tier) {
  assert.ok(this.rivals && this.rivals.length > 0)
  assert.ok(this.rivals.every(r => r.tier === tier), `Se esperaba que todos los rivales fueran de categoría ${tier}`)
})

Then('cada rival tiene estadio real y capacidad registrada', function () {
  for (const r of this.rivals) {
    assert.ok(r.stadium_name && r.stadium_name.length > 0, `${r.name} no tiene estadio`)
    assert.ok(r.stadium_capacity && r.stadium_capacity >= 1000, `${r.name} tiene capacidad menor a 1000`)
  }
})

Then('ningún nombre de club se repite entre los rivales', function () {
  const names = this.rivals.map(r => r.name)
  const set = new Set(names)
  assert.equal(set.size, names.length, 'Hay nombres de clubes duplicados')
})

When('se sortean {int} rivales excluyendo al club {string}', function (count, excludedClub) {
  this.excludedClub = excludedClub
  this.rivals = pickRivalClubs('carrera-exclusion', count, { tier: this.tier, exclude: [excludedClub] })
})

Then('el club {string} no forma parte de los rivales', function (excludedClub) {
  assert.ok(
    !this.rivals.some(r => r.name.toLowerCase() === excludedClub.toLowerCase()),
    `El club ${excludedClub} fue incluido indebidamente en los rivales`
  )
})
