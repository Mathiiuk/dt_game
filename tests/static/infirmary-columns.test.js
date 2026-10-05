import { readFileSync } from 'node:fs'

// Columnas reales de `players` usadas por la enfermería (400 en producción si se pide una que no existe)
describe('enfermería: columnas de players', () => {
  const src = readFileSync('src/api/injuries.js', 'utf8')
  const block = src.slice(src.indexOf('async getClubInfirmary'), src.indexOf('async getPlayerMedicalHistory'))

  it('no pide columnas inexistentes (number, photo_url)', () => {
    expect(block).not.toMatch(/^\s*number,?\s*$/m)
    expect(block).not.toMatch(/photo_url/)
  })

  it('pide el dorsal como shirt_number', () => {
    expect(block).toMatch(/shirt_number/)
  })
})
