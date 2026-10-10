// logAction recibe un objeto { whoId, action, ... }: con argumentos sueltos el registro de auditoría nunca se guardaba
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const walk = (dir) => readdirSync(dir).flatMap(f => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? walk(p) : /\.(js|jsx)$/.test(f) ? [p] : []
})

describe('llamadas a auditApi.logAction', () => {
  it('todas pasan un objeto, no argumentos sueltos', () => {
    const bad = []
    for (const file of walk('src')) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/logAction\(\s*([^\s{)])/g)) bad.push(`${file}: logAction(${m[1]}…`)
    }
    expect(bad).toEqual([])
  })
})
