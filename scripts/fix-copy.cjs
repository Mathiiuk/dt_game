// Barrido de textos de la interfaz: castellano rioplatense, sin "&" ni Title Case ("Cuerpo Técnico Actual" -> "Cuerpo técnico actual")
// y errores amigables. Uso: node scripts/fix-copy.cjs [--write]   (sin --write sólo muestra el resumen y una muestra de cambios)
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')

const { sentenceCase, looksTitleCase } = require('./copy-rules.cjs')

const walk = (dir) => fs.readdirSync(dir).flatMap(n => {
  const f = path.join(dir, n)
  return fs.statSync(f).isDirectory() ? walk(f) : /\.jsx$/.test(n) ? [f] : []
})

let totalChanges = 0
let toastChanges = 0
let ampChanges = 0
const samples = []

for (const file of walk('src')) {
  let src = fs.readFileSync(file, 'utf8')
  const original = src

  // 1) Errores crudos -> friendlyError (con el texto de respaldo que ya tenía la pantalla)
  let usedFriendly = false
  src = src.replace(/toast\.error\((e|err|error)\.message\s*\|\|\s*('[^']*'|"[^"]*"|`[^`]*`)\)/g, (m, v, fb) => { usedFriendly = true; toastChanges++; return `toast.error(friendlyError(${v}, ${fb}))` })
  src = src.replace(/toast\.error\((e|err|error)\.message\)/g, (m, v) => { usedFriendly = true; toastChanges++; return `toast.error(friendlyError(${v}))` })
  // 2) Textos visibles: nodos de texto JSX en una línea (>texto<) y líneas que son sólo texto
  const lines = src.split('\n')
  let inImport = false
  const fixed = lines.map((line) => {
    const trimmed = line.trim()
    if (/^import\s*\{[^}]*$/.test(trimmed)) { inImport = true; return line }
    if (inImport) { if (/\}\s*from/.test(trimmed)) inImport = false; return line }
    if (trimmed.startsWith('//') || trimmed.startsWith('{/*') || trimmed.startsWith('*') || trimmed.startsWith('import ')) return line

    let out = line
    // nodos de texto inline
    out = out.replace(/>([^<>{}\n]+)</g, (m, text) => {
      let t = text
      if (/ & /.test(t)) { t = t.replace(/ & /g, ' y '); ampChanges++ }
      if (looksTitleCase(t)) t = sentenceCase(t)
      return t === text ? m : `>${t}<`
    })
    // línea que es sólo texto (continuación de un elemento multilínea)
    if (/^[A-ZÁÉÍÓÚÑ¿¡][^<>{}=;()]*$/.test(trimmed) && /\s/.test(trimmed) && !/^[A-Z_]+$/.test(trimmed) && !/[,]$/.test(trimmed) && !/^[A-Z_]+:\s/.test(trimmed)) {
      let t = trimmed
      if (/ & /.test(t)) { t = t.replace(/ & /g, ' y '); ampChanges++ }
      if (looksTitleCase(t)) t = sentenceCase(t)
      if (t !== trimmed) out = line.replace(trimmed, t)
    }
    // literales label/title/desc/description: 'Texto Con Mayúsculas'
    out = out.replace(/\b(label|title|desc|description|name):\s*'([^'\n]+)'/g, (m, k, text) => {
      let t = text
      if (/ & /.test(t)) { t = t.replace(/ & /g, ' y '); ampChanges++ }
      if (looksTitleCase(t)) t = sentenceCase(t)
      return t === text ? m : `${k}: '${t}'`
    })
    return out
  })
  src = fixed.join('\n')

  const textOnly = src
  if (src !== original) {
    const before = original.split('\n')
    const after = src.split('\n')
    let diffs = 0
    for (let i = 0; i < Math.min(before.length, after.length); i++) {
      if (before[i] !== after[i]) { diffs++; if (samples.length < 400) samples.push(`${path.basename(file)}:${i + 1}\n  - ${before[i].trim().slice(0, 110)}\n  + ${after[i].trim().slice(0, 110)}`) }
    }
    totalChanges += diffs
    if (WRITE) {
      if (usedFriendly && !/from ['"][./]+\/lib\/errors['"]/.test(src)) {
        const rel = path.relative(path.dirname(file), 'src/lib/errors').split(path.sep).join('/')
        const importLine = `import { friendlyError } from '${rel.startsWith('.') ? rel : './' + rel}'`
        const ls = src.split('\n')
        let last = 0
        ls.forEach((l, i) => { if (/^import .* from ['"].*['"]\s*;?\s*$/.test(l) || /^} from ['"].*['"]\s*;?\s*$/.test(l)) last = i })
        ls.splice(last + 1, 0, importLine)
        src = ls.join('\n')
      }
      fs.writeFileSync(file, src)
    }
  }
}

console.log(`Líneas modificadas: ${totalChanges} (errores amigables: ${toastChanges}, "&" -> "y": ${ampChanges})`)
console.log(samples.join('\n'))
