// Migra clases de la paleta antigua (zinc/emerald/amber/red) a los tokens del sistema de diseño.
// Uso: node scripts/restyle-tokens.cjs <archivo...>
const fs = require('fs')
const rules = [
  [/\btext-zinc-950\b/g, 'text-accent-fg'],
  [/\b(bg)-zinc-950\b/g, '$1-bg'],
  [/\b(bg|from|to|via)-zinc-900\b/g, '$1-surface'],
  [/\b(bg|from|to|via)-zinc-(800|700)\b/g, '$1-surface-3'],
  [/\b(border|divide|ring|outline)-zinc-(900|800|700)\b/g, '$1-line'],
  [/\b(border|divide|ring)-zinc-600\b/g, '$1-line-strong'],
  [/\b(text|placeholder)-(zinc-(100|200|300)|white)\b/g, '$1-fg'],
  [/\b(text|placeholder)-zinc-400\b/g, '$1-fg-muted'],
  [/\b(text|placeholder)-zinc-(500|600)\b/g, '$1-fg-subtle'],
  [/\b(text|border|ring)-emerald-(300|400|500)\b/g, '$1-accent'],
  [/\bbg-emerald-(500|600)\b/g, 'bg-accent'],
  [/\bbg-emerald-400\b/g, 'bg-accent-strong'],
  [/\bhover:bg-emerald-(400|500)\b/g, 'hover:bg-accent-strong'],
  [/\b(from|to)-emerald-\d+\b/g, '$1-accent'],
  [/\b(text|border)-(amber|yellow)-(300|400|500)\b/g, '$1-gold'],
  [/\bbg-(amber|yellow)-(400|500|600)\b/g, 'bg-gold'],
  [/\b(from|to)-(amber|yellow)-\d+\b/g, '$1-gold'],
  [/\b(text|border)-(red|rose)-(300|400|500)\b/g, '$1-danger'],
  [/\bbg-(red|rose)-(500|600)\b/g, 'bg-danger'],
  [/\bfont-black\b/g, 'font-semibold'],
  [/\brounded-3xl\b/g, 'rounded-xl'],
  [/\brounded-2xl\b/g, 'rounded-lg'],
]
for (const f of process.argv.slice(2)) {
  let s = fs.readFileSync(f, 'utf8')
  for (const [re, to] of rules) s = s.replace(re, to)
  fs.writeFileSync(f, s)
}
