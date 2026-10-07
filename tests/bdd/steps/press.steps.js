import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { memoryQuestion, situationQuestion } from '../../../src/domain/pressSituations.js'

const SITUACIONES = {
  '4 derrotas seguidas': { lossStreak: 4 },
  '3 victorias seguidas': { winStreak: 3 },
  '6 partidos sin perder': { unbeaten: 6 },
  'un ex jugador en el rival': { exPlayerName: 'Matías Ferreyra' }
}

Given('el club viene con {}', function (situacion) {
  this.pressCtx = SITUACIONES[situacion]
  assert.ok(this.pressCtx, `situación desconocida: ${situacion}`)
})

When('el periodista arma la pregunta de la conferencia', function () {
  this.question = situationQuestion(this.pressCtx, () => 0.1)
})

Then('la pregunta es de tipo {word}', function (tipo) {
  assert.equal(this.question.topic_category, tipo)
})

Given('las últimas tres respuestas fueron combativas', function () {
  this.tones = ['COMBATIVE', 'COMBATIVE', 'COMBATIVE']
})

Given('las últimas tres respuestas fueron combativa, elogiosa y combativa', function () {
  this.tones = ['COMBATIVE', 'PRAISING', 'COMBATIVE']
})

When('el periodista revisa cómo contestó el DT', function () {
  this.memory = memoryQuestion(this.tones, () => 0.1)
})

Then('hay una pregunta de memoria sobre la relación con la prensa', function () {
  assert.equal(this.memory.topic_category, 'MEDIA_RELATIONSHIP')
})

Then('no hay pregunta de memoria', function () {
  assert.equal(this.memory, null)
})
