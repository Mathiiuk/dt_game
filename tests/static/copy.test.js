import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import rules from '../../scripts/copy-rules.cjs'

// Reglas de redacción de la interfaz: castellano coloquial, sin "&", sin Title Case y sin errores crudos de la base.
const walk = (dir) => readdirSync(dir).flatMap(name => {
  const full = join(dir, name)
  return statSync(full).isDirectory() ? walk(full) : name.endsWith('.jsx') ? [full] : []
})

const files = walk('src')
const code = (line) => { const t = line.trim(); return !(t.startsWith('//') || t.startsWith('{/*') || t.startsWith('*') || t.startsWith('/*')) }

const offenders = (test) => files.flatMap(file =>
  readFileSync(file, 'utf8').split('\n').flatMap((line, i) => (code(line) ? test(line).map(msg => `${file}:${i + 1}  ${msg}`) : []))
)

describe('redacción de la interfaz', () => {
  it('no usa "&" en los textos (se escribe "y")', () => {
    const bad = offenders(line => [...line.matchAll(/>([^<>{}\n]*\s&\s[^<>{}\n]*)</g)].map(m => m[1].trim()))
    expect(bad).toEqual([])
  })

  it('los textos no van en Title Case ("Cuerpo técnico actual", no "Cuerpo Técnico Actual")', () => {
    const bad = offenders(line => {
      const found = []
      for (const m of line.matchAll(/>([^<>{}\n]+)</g)) if (rules.looksTitleCase(m[1])) found.push(m[1].trim())
      for (const m of line.matchAll(/\b(?:label|title|desc|description):\s*'([^'\n]+)'/g)) if (rules.looksTitleCase(m[1])) found.push(m[1])
      return found
    })
    expect(bad).toEqual([])
  })

  it('los errores no se muestran crudos: se pasan por friendlyError', () => {
    const bad = offenders(line => (/toast\.error\((e|err|error)\.message/.test(line) ? [line.trim()] : []))
    expect(bad).toEqual([])
  })

  it('no hay términos en inglés a la vista en los textos más comunes', () => {
    const bad = offenders(line => [...line.matchAll(/>([^<>{}\n]*\b(Dashboard|dashboard|Loading|Cancel|Submit|Save|Continue|Skip)\b[^<>{}\n]*)</g)].map(m => m[1].trim()))
    expect(bad).toEqual([])
  })
})
