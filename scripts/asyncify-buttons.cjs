// Convierte <button> sueltos con manejadores asíncronos en <AsyncButton> (bloqueo + spinner). Uso: node scripts/asyncify-buttons.cjs
const fs = require('fs')
const path = require('path')
const targets = {
  'src/features/club/screens/LockerRoomTab.jsx': ['handleResolveConflict', 'handleHoldTeamMeeting'],
  'src/features/club/screens/InfirmaryTab.jsx': ['loadInfirmary', 'handleInfiltrate'],
  'src/features/club/screens/StadiumManagementTab.jsx': ['handleStartProject'],
  'src/features/club/screens/BoardManagementTab.jsx': ['handleRequestFunding'],
  'src/features/career/EndgameScreen.jsx': ['handleStartDynasty'],
  'src/features/match/PostMatchScreen.jsx': ['handleDelegatePress', 'handleSelectPressOption']
}
for (const [file, handlers] of Object.entries(targets)) {
  let s = fs.readFileSync(file, 'utf8')
  let count = 0
  let out = ''
  let i = 0
  while (true) {
    const start = s.indexOf('<button', i)
    if (start === -1) { out += s.slice(i); break }
    const end = s.indexOf('</button>', start)
    out += s.slice(i, start)
    let block = s.slice(start, end + '</button>'.length)
    if (/onClick=\{/.test(block) && handlers.some(h => block.includes(h))) {
      block = '<AsyncButton' + block.slice('<button'.length, block.length - '</button>'.length) + '</AsyncButton>'
      count++
    }
    out += block
    i = end + '</button>'.length
  }
  if (count) {
    // import relativo a src/components/ui
    const rel = path.relative(path.dirname(file), 'src/components/ui').split(path.sep).join('/')
    const importLine = `import { AsyncButton } from '${rel.startsWith('.') ? rel : './' + rel}'\n`
    if (!out.includes("AsyncButton } from")) {
      const lines = out.split('\n')
      let last = 0
      lines.forEach((l, idx) => { if (l.startsWith('import ')) last = idx })
      // saltar imports multilínea: buscar la línea que cierra con from '...'
      while (last < lines.length - 1 && !/from\s+['"].*['"]\s*;?\s*$/.test(lines[last])) last++
      lines.splice(last + 1, 0, importLine.trimEnd())
      out = lines.join('\n')
    }
  }
  fs.writeFileSync(file, out)
  console.log(file, 'botones convertidos:', count)
}
