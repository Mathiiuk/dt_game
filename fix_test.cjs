const fs = require('fs')

let code = fs.readFileSync('tests/ui/matchDecisions.test.jsx', 'utf8')
code = code.replace(
  'it(\'una lesión propia pausa el partido y "Sacarlo ahora" abre los cambios con el lesionado marcado\', async () => {',
  'it(\'una lesión propia pausa el partido y "Elegí quién entra" abre los cambios con el lesionado marcado\', async () => {'
)
code = code.replace(
  'expect(screen.getByRole(\'region\', { name: \'Un lesionado en tu equipo\' })).toBeInTheDocument()',
  'expect(screen.getByText(/Se lesionó/)).toBeInTheDocument()'
)
code = code.replace(
  'click(screen.getByRole(\'button\', { name: /Sacarlo ahora/ }))',
  'click(screen.getByRole(\'button\', { name: /Elegí quién entra/ }))'
)

fs.writeFileSync('tests/ui/matchDecisions.test.jsx', code, 'utf8')
