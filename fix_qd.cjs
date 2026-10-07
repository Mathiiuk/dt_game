const fs = require('fs')

let code = fs.readFileSync('src/domain/quickDecisions.js', 'utf8')

code = code.replace(
  "title: keeper ? 'Se lesionó el arquero' : 'Un lesionado en tu equipo'",
  "title: `Se lesionó ${pName} (${pPos})`"
)

code = code.replace(
  "const keeper = isKeeper(onField.find(p => p.id === hurt.playerId))",
  "const p = onField.find(pl => pl.id === hurt.playerId) || {}\n      const keeper = isKeeper(p)\n      const pName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Un jugador'\n      const pPos = p.slot_base || p.position || '?'"
)

code = code.replace(
  "text: hurt.text,",
  "text: 'Elegí quién entra o pedile que aguante en la cancha.',"
)

code = code.replace(
  "label: 'Sacarlo ahora', desc: 'Abre los cambios con él marcado para salir.'",
  "label: 'Elegí quién entra', desc: 'Abre los suplentes para que elijas.'"
)

fs.writeFileSync('src/domain/quickDecisions.js', code, 'utf8')
