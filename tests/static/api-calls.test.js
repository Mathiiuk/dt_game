import fs from 'node:fs'
import path from 'node:path'

// Guardia estática (B4): ninguna llamada xxxApi.fn() puede apuntar a un método que no esté definido en src/api
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])

describe('llamadas a módulos api', () => {
  it('todas las llamadas xxxApi.fn() tienen definición', () => {
    const defs = new Set()
    for (const f of fs.readdirSync('src/api').filter(f => f.endsWith('.js'))) {
      const t = fs.readFileSync(path.join('src/api', f), 'utf8')
      for (const m of t.matchAll(/^\s+(?:async\s+)?([A-Za-z_]\w*)\s*\(/gm)) defs.add(m[1])
    }
    const missing = []
    for (const f of walk('src').filter(f => /\.(js|jsx)$/.test(f))) {
      const t = fs.readFileSync(f, 'utf8')
      for (const m of t.matchAll(/\b([a-z][A-Za-z]*Api)\.([A-Za-z_]\w*)\s*\(/g)) {
        if (!defs.has(m[2])) missing.push(`${f}: ${m[1]}.${m[2]}()`)
      }
    }
    expect(missing).toEqual([])
  })
})
