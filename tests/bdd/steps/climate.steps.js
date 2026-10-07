import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { STAGE_EVENTS } from '../../../src/domain/climateEvents.js'
import { pickEvent } from '../../../src/domain/barra.js'
import { detectCombos } from '../../../src/domain/combos.js'

Given('la barra está en la etapa {word} con presión {int}', function (etapa, presion) {
  this.climateState = { barra: etapa, pressure: presion }
})

When('se sortean los eventos de ambiente de la semana', function () {
  // Se barre el sorteo completo: todos los climas posibles y 400 tiradas parejas
  this.drawn = new Set()
  for (const climate of ['FLOWS', 'TENSION', 'CRISIS', 'CHAOS']) {
    for (let i = 0; i < 400; i++) {
      const t = pickEvent(STAGE_EVENTS, { climate, state: this.climateState }, () => (i + 0.5) / 400)
      if (t) this.drawn.add(t.template_code)
    }
  }
})

Then('el evento {word} puede aparecer', function (codigo) {
  assert.ok(this.drawn.has(codigo))
})

Then('el evento {word} no puede aparecer', function (codigo) {
  assert.ok(!this.drawn.has(codigo))
})

Given('una racha de {int} victorias con {int} lesionados', function (wins, injured) {
  this.comboCtx = { streaks: { win: wins }, injuredCount: injured }
})

When('se detectan los combos de la semana', function () {
  this.combos = detectCombos(this.comboCtx)
})

Then('aparece el combo {word}', function (key) {
  assert.ok(this.combos.some(c => c.key === key))
})

Then('no aparece ningún combo', function () {
  assert.deepEqual(this.combos, [])
})
