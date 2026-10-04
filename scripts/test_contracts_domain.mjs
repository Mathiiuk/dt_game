// Pruebas del dominio de contratos. Uso: node scripts/test_contracts_domain.mjs
import assert from 'node:assert/strict'
import {
  seasonEndDate, contractEndFor, weeksBetween, yearsRemaining,
  isContractExpiringSoon, pickInitialContractYears
} from '../src/domain/contracts.js'

// Cierre de temporada = próximo 30 de junio
assert.equal(seasonEndDate('2026-07-01'), '2027-06-30')
assert.equal(seasonEndDate('2026-08-15'), '2027-06-30')
assert.equal(seasonEndDate('2027-01-10'), '2027-06-30')
assert.equal(seasonEndDate('2027-06-30'), '2027-06-30')

// Un contrato de 1 año firmado en pretemporada vence al cierre de esa temporada
assert.equal(contractEndFor('2026-08-15', 1), '2027-06-30')
assert.equal(contractEndFor('2026-08-15', 3), '2029-06-30')

// Escenario del bug B3: en pretemporada un contrato de 1 año NO está por vencer (faltan ~45 semanas)
assert.equal(isContractExpiringSoon('2027-06-30', '2026-08-15'), false)
// A 6 meses del vencimiento sí avisa
assert.equal(isContractExpiringSoon('2027-06-30', '2026-12-30'), true)
// Ya vencido no cuenta como "por vencer"
assert.equal(isContractExpiringSoon('2027-06-30', '2027-07-05'), false)
assert.equal(isContractExpiringSoon(null, '2026-08-15'), false)

assert.equal(weeksBetween('2026-08-15', '2026-08-22'), 1)
assert.equal(yearsRemaining('2027-06-30', '2026-08-15'), 1)
assert.equal(yearsRemaining('2029-06-30', '2026-08-15'), 3)
assert.equal(yearsRemaining('2026-06-30', '2026-08-15'), 0)

// Distribución: determinista con rng fijo y dentro de 1..5
assert.equal(pickInitialContractYears(() => 0), 1)
assert.equal(pickInitialContractYears(() => 0.999), 5)
const counts = {}
let seed = 1
const lcg = () => (seed = (seed * 48271) % 2147483647) / 2147483647
for (let i = 0; i < 20000; i++) { const y = pickInitialContractYears(lcg); counts[y] = (counts[y] || 0) + 1 }
assert.ok(counts[1] / 20000 > 0.17 && counts[1] / 20000 < 0.23, 'peso de 1 año ~20%')
assert.ok(counts[3] / 20000 > 0.27 && counts[3] / 20000 < 0.33, 'peso de 3 años ~30%')

console.log('OK: dominio de contratos')
