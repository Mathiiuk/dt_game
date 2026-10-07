import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { negotiateJob } from '../../../src/domain/jobNegotiation.js'

Given('una oferta de {int} por semana para un puesto que exige reputación {int}', function (sueldo, exigida) {
  this.job = { offered: sueldo, requiredReputation: exigida }
})

Given('el DT tiene reputación {int}', function (rep) {
  this.job.reputation = rep
})

const ROUNDS = { primera: 1, segunda: 2, tercera: 3 }

When('pide {int} por semana en la {word} ronda', function (pedido, ronda) {
  this.reply = negotiateJob({ ...this.job, ask: pedido, round: ROUNDS[ronda] })
})

Then('el club responde {word}', function (status) {
  assert.equal(this.reply.status, status)
})
