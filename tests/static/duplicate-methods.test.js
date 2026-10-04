import fs from 'node:fs'
import path from 'node:path'

// Guardia estática: un método definido dos veces en el mismo objeto api se sobrescribe en silencio
// (la última definición gana) y deja código muerto que engaña al leerlo y al optimizarlo.
describe('módulos api', () => {
  it('no definen dos veces el mismo método en un objeto', () => {
    const dupes = []
    for (const f of fs.readdirSync('src/api').filter(f => f.endsWith('.js'))) {
      const text = fs.readFileSync(path.join('src/api', f), 'utf8')
      const counts = {}
      // Métodos de objeto con sangría de 2 espacios: `  async nombre(` o `  nombre(`
      for (const m of text.matchAll(/^ {2}(?:async\s+)?([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/gm)) {
        if (['if', 'for', 'while', 'switch', 'catch', 'function'].includes(m[1])) continue
        counts[m[1]] = (counts[m[1]] || 0) + 1
      }
      for (const [name, n] of Object.entries(counts)) {
        if (n > 1) dupes.push(`${f}: ${name} x${n}`)
      }
    }
    expect(dupes).toEqual([])
  })
})
