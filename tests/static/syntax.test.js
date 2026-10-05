import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import * as vite from 'vite'

// Compila cada archivo de src: un error de sintaxis (por ejemplo tras un cambio masivo) rompe el build y la pantalla
const walk = (dir) => readdirSync(dir).flatMap(name => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? walk(full) : /\.(jsx?|mjs)$/.test(name) ? [full] : []
})

describe('sintaxis de src', () => {
  const files = walk('src')
  it('encuentra archivos para comprobar', () => expect(files.length).toBeGreaterThan(50))

  it.each(files)('%s compila', async (file) => {
    const code = readFileSync(file, 'utf8')
    const result = await vite.transformWithOxc(code, file, { lang: file.endsWith('.jsx') ? 'jsx' : 'js' })
    expect(typeof result.code).toBe('string')
  })
})
