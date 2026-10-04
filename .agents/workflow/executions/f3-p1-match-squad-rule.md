# Reporte de Ejecución: f3-p1-match-squad-rule
- **Rama**: `feat/f3-p1-match-squad-rule` | **Estado**: `DONE`
- **Decisión del usuario**: un partido nunca queda bloqueado por falta de aptos: se juega igual con juveniles o lesionados.
- **Regla implementada** (`src/domain/matchSquad.js`, función pura): 1) titulares del DT que estén aptos; 2) mejores aptos del plantel; 3) juveniles de la cantera (hasta 4, rendimiento bajo, no se persisten); 4) lesionados (los de menor gravedad primero) con −20% de rendimiento, fitness tope 50 y 35% de riesgo de agravar (+2 semanas); 5) último recurso: más juveniles hasta completar 11.
- **Integración**:
  - `MatchScreen`: el motor ahora recibe **el once real** (antes recibía todo el plantel, incluidos lesionados, e ignoraba la alineación) y se muestra un aviso "Plantel incompleto" antes del pitazo cuando corresponde.
  - `postMatch`: los lesionados que jugaron no reciben una lesión nueva; se tira el 35% de agravar la existente (`_applyAggravations`, usa `batch_update_injuries`).
  - Dashboard: el texto de la alerta explica que se puede jugar igual.
- **Tests**: 9 nuevos (armado del once con plantel sano, titular lesionado, 5 aptos + 15 lesionados, plantel casi vacío, suspendidos, penalización, agravamiento determinista, persistencia del agravamiento). Total 40 (`agt task:verify` → `unit_tests -> npm test`).
- **Verificación en navegador**: partido completo con el nuevo armado del once → resumen cargado, 0 errores de red.
