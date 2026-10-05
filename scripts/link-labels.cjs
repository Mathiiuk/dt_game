// Asocia cada <label> con el control que le sigue (htmlFor/id) para accesibilidad. Uso: node scripts/link-labels.cjs <archivo...>
const fs = require('fs')
const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
for (const f of process.argv.slice(2)) {
  let s = fs.readFileSync(f, 'utf8')
  let n = 0
  s = s.replace(/<label className="([^"]*)">([^<{]+)<\/label>(\s*)<(input|select|textarea)(\s)/g, (m, cls, text, ws, tag, sp) => {
    const id = `f-${slug(text)}-${++n}`
    return `<label htmlFor="${id}" className="${cls}">${text}</label>${ws}<${tag} id="${id}"${sp}`
  })
  fs.writeFileSync(f, s)
  console.log(f, 'labels vinculados:', n)
}
