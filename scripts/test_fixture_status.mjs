// Uso: node scripts/test_fixture_status.mjs
import assert from 'node:assert/strict'
import { isFixtureOpen, isFixturePlayed, isFixtureDue, toDay, FIXTURE_STATUS } from '../src/domain/fixtureStatus.js'

assert.ok(isFixtureOpen('SCHEDULED') && isFixtureOpen('PENDING'))   // bug B2: el dashboard solo veía PENDING
assert.ok(!isFixtureOpen('PLAYED') && !isFixtureOpen('FINISHED'))
assert.ok(isFixturePlayed('PLAYED') && isFixturePlayed('FINISHED'))
assert.ok(!isFixturePlayed('SCHEDULED'))
assert.equal(FIXTURE_STATUS.PLAYED, 'PLAYED')
assert.equal(toDay('2026-08-01T00:00:00+00:00'), '2026-08-01')
// match_date con hora no debe considerarse futuro el mismo día
assert.ok(isFixtureDue('2026-08-01T00:00:00.000Z', '2026-08-01'))
assert.ok(!isFixtureDue('2026-08-08', '2026-08-01'))
assert.ok(isFixtureDue('2026-08-01', '2026-08-05'))
assert.ok(!isFixtureDue(null, '2026-08-01'))
console.log('OK: estados de fixture')
