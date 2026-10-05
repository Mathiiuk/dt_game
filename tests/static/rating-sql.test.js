import { readFileSync } from 'node:fs'
import { buildRatingSql } from '../../scripts/gen-rating-sql.mjs'

describe('migración de medias por posición', () => {
  it('el SQL versionado está al día con los pesos de src/domain/ratings.js (regenerar con node scripts/gen-rating-sql.mjs)', () => {
    const file = readFileSync('scripts/db/migration_position_ratings.sql', 'utf8').replace(/\r\n/g, '\n')
    expect(file).toBe(buildRatingSql())
  })
})
