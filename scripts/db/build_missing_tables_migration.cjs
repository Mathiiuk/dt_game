// Genera una migracion ADITIVA (sin DROP) con las tablas de supabase.sql que no existen en la BD viva.
const fs = require('fs')
const sql = fs.readFileSync('supabase.sql', 'utf8').split('\r\n').join('\n')
const missing = new Set(fs.readFileSync(process.argv[2], 'utf8').split(/\s+/).filter(Boolean))
// Quitar comentarios de linea (respetando que no hay '--' dentro de strings relevantes)
const clean = sql.split('\n').map(l => l.replace(/--.*$/, '')).join('\n')
// Separar sentencias por ';' (no hay cuerpos de funcion para las tablas objetivo)
const stmts = clean.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)
const out = []
const tblOf = (s) => {
  const m = s.match(/^(?:CREATE TABLE IF NOT EXISTS|ALTER TABLE(?: IF EXISTS)?|CREATE (?:UNIQUE )?INDEX(?: IF NOT EXISTS)? \S+ ON|CREATE POLICY "[^"]+" ON|CREATE TRIGGER \S+ BEFORE UPDATE ON|INSERT INTO)\s+(?:ONLY\s+)?(?:public\.)?([a-z_]+)/i)
  return m ? m[1] : null
}
for (const s of stmts) {
  const t = tblOf(s)
  if (!t || !missing.has(t)) continue
  if (/^CREATE POLICY/i.test(s)) {
    const name = s.match(/^CREATE POLICY "([^"]+)"/)[1]
    out.push(`DROP POLICY IF EXISTS "${name}" ON public.${t};`)
  }
  if (/^CREATE TRIGGER/i.test(s)) {
    const name = s.match(/^CREATE TRIGGER (\S+)/)[1]
    out.push(`DROP TRIGGER IF EXISTS ${name} ON public.${t};`)
  }
  let st = s
  if (/^CREATE INDEX (?!IF NOT EXISTS)/i.test(st)) st = st.replace(/^CREATE INDEX /i, 'CREATE INDEX IF NOT EXISTS ')
  if (/^INSERT INTO/i.test(st) && !/ON CONFLICT/i.test(st)) st += ' ON CONFLICT DO NOTHING'
  out.push(st + ';')
}
fs.writeFileSync(process.argv[3], out.join('\n') + '\n')
console.log('sentencias:', out.length, ' tablas CREATE:', out.filter(x => /^CREATE TABLE/.test(x)).length)
