const fs = require('fs')
let code = fs.readFileSync('tests/ui/matchDecisions.test.jsx', 'utf8')
code = code.replace(
  "expect(screen.getByText(/Se lesionó/)).toBeInTheDocument()",
  "expect(screen.getByRole('region', { name: /Se lesionó/ })).toBeInTheDocument()"
)
fs.writeFileSync('tests/ui/matchDecisions.test.jsx', code, 'utf8')
