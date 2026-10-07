import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { evaluateBoardAfterMatch } from '../../../src/domain/boardConfidence.js'

const baseBoard = (over = {}) => ({ sports_satisfaction: 70, financial_satisfaction: 70, squad_satisfaction: 70, is_under_ultimatum: false, ultimatum_points_required: 0, ultimatum_matches_remaining: 0, ultimatum_points_gathered: 0, ...over })
const OUTCOMES = { gana: { isWin: true }, empata: { isDraw: true }, pierde: {} }

Given('la directiva está conforme con deportiva {int}, financiera {int} y plantel {int}', function (s, f, p) {
  this.board = baseBoard({ sports_satisfaction: s, financial_satisfaction: f, squad_satisfaction: p })
})

Given('la directiva está en crisis con deportiva {int}, financiera {int} y plantel {int}', function (s, f, p) {
  this.board = baseBoard({ sports_satisfaction: s, financial_satisfaction: f, squad_satisfaction: p })
})

Given('la directiva dio un ultimátum con un partido restante y {int} puntos de {int}', function (got, req) {
  this.board = baseBoard({ is_under_ultimatum: true, ultimatum_points_required: req, ultimatum_matches_remaining: 1, ultimatum_points_gathered: got })
})

When('el equipo {word}', function (resultado) {
  this.verdict = evaluateBoardAfterMatch(this.board, OUTCOMES[resultado])
})

Then('el ánimo deportivo queda en {int}', function (valor) {
  assert.equal(this.verdict.sports, valor)
})

Then('se emite un ultimátum y no hay despido', function () {
  assert.equal(this.verdict.event, 'ISSUED')
  assert.equal(this.verdict.dismissal, null)
})

Then('el DT es despedido por ultimátum fallido', function () {
  assert.equal(this.verdict.dismissal, 'ULTIMATUM_FAILED')
})
