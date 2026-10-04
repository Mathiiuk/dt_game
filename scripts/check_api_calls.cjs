// Guardia estática: detecta llamadas a métodos xxxApi.fn() que no están definidos en ningún módulo de src/api.
// Uso: node scripts/check_api_calls.cjs   (sale con código 1 si encuentra llamadas huérfanas)
const fs = require('fs')
const path = require('path')

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])

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
if (missing.length) {
  console.error('Llamadas a métodos inexistentes:\n' + missing.join('\n'))
  process.exit(1)
}
console.log('OK: todas las llamadas xxxApi.fn() tienen definición.')
