const fs = require('fs')
const path = require('path')

const dirs = [
  '.agents/workflow/features',
  'tests/bdd/steps'
]

const replacements = {
  'A-': 'í',
  'A3': 'ó',
  'A ': 'á', // sometimes A space is á? wait, A is á
  'A': 'á',
  'A\u00a0': 'á', // another variant
  'An': 'ún',
  'As': 'ás',
  'A©': 'é',
  'Ac': 'é',
  'A±': 'ñ',
  'A ': 'á',
  'A¨': 'è'
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file)
    if (fs.statSync(full).isDirectory()) {
      processDir(full)
    } else if (full.endsWith('.feature') || full.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8')
      let changed = false
      
      // Let's replace the specific ones we know are failing
      const exactReplacements = [
        ['categorA-a', 'categoría'],
        ['estA', 'está'],
        ['segAn', 'según'],
        ['terminA3', 'terminó'],
        ['nAmero', 'número'],
        ['Arbitro', 'árbitro'],
        ['A-tem', 'ítem'],
        ['tA-tulo', 'título'],
        ['descripciA3n', 'descripción'],
        ['mA3vil', 'móvil'],
        ['pAgina', 'página'],
        ['opciA3n', 'opción'],
        ['decisiA3n', 'decisión']
      ]
      
      for (const [bad, good] of exactReplacements) {
        if (content.includes(bad)) {
          content = content.split(bad).join(good)
          changed = true
        }
      }
      
      if (changed) {
        fs.writeFileSync(full, content, 'utf8')
      }
    }
  }
}

dirs.forEach(processDir)
