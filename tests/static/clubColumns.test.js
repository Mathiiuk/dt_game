import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// La tabla clubs no tiene estas columnas: pedirlas hace fallar la consulta entera (y el cierre de temporada lo ocultaba)
const MISSING_CLUB_COLUMNS = ['logo_url']

const walk = (dir) => readdirSync(dir).flatMap(f => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') || p.endsWith('.jsx') ? [p] : []
})

describe('columnas de clubs que existen', () => {
  it('ninguna consulta pide columnas inexistentes', () => {
    const offenders = walk('src').filter(f => MISSING_CLUB_COLUMNS.some(c => readFileSync(f, 'utf8').includes(c)))
    expect(offenders).toEqual([])
  })
})
