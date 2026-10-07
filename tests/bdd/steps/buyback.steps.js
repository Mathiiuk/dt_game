import assert from 'node:assert/strict'
import { Given, When, Then } from '@cucumber/cucumber'
import { buybackTerms } from '../../../src/domain/buyback.js'

Given('el club vendió a un jugador por {int}', function (venta) {
  this.sale = venta
})

When('calcula la cláusula de recompra', function () {
  this.terms = buybackTerms(this.sale)
})

Then('paga {int} por dejarla y lo recompra por {int}', function (costo, precio) {
  assert.deepEqual(this.terms, { cost: costo, price: precio })
})
