import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { ARC_CATALOG } from '../../../src/domain/arcCatalog.js'
import { endingFor, closingTail } from '../../../src/domain/arcs.js'

Given('el DT eligió el camino {word} en la historia del pibe', function (marca) {
  this.flags = [marca]
})

When('cierra la historia vendiendo al pibe', function () {
  const pibe = ARC_CATALOG.find(a => a.id === 'pibe')
  const venta = pibe.chapters[3].options.find(o => o.id === 'A')
  this.ending = endingFor(venta, this.flags, {})
})

Then('el final menciona {string}', function (frase) {
  assert.ok(this.ending.includes(frase), `"${this.ending}" no incluye "${frase}"`)
})

Given('la barra está en la etapa {word} y la dirigencia en {int}', function (etapa, dirigencia) {
  this.arcCtx = { barra: etapa, board: dirigencia, favors: 0 }
})

When('se cierra una historia sin variantes', function () {
  this.tail = closingTail(this.arcCtx)
})

Then('la frase de cierre menciona {string}', function (frase) {
  assert.ok(this.tail.toLowerCase().includes(frase.toLowerCase()), `"${this.tail}" no incluye "${frase}"`)
})

Then('no hay frase de cierre', function () {
  assert.equal(this.tail, '')
})
