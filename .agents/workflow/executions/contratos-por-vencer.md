# contratos-por-vencer

Al abrir el Plantel desde el aviso de contratos por vencer ya se ve **quién** vence.

- **Antes:** el aviso abría el Plantel ordenado por vencimiento, pero sin decir quiénes eran ni cuánto les faltaba; había que adivinar quién estaba arriba.
- **Ahora:** `expiringPlayers` (misma regla del aviso) devuelve a los jugadores con contrato por vencer y las semanas que les faltan. Con el aviso, el Plantel abre mostrando solo a esos jugadores y un panel "Contratos por vencer (N)" que lista cada nombre, su posición y "vence en N semanas" (en rojo si quedan 12 o menos), con un botón **Renovar** al lado de cada uno. Hay un botón para ver todo el plantel y volver. Cada jugador con contrato por vencer lleva además una insignia "Contrato: vence en N semanas", se entre por donde se entre.
- **Dónde:** `src/domain/contracts.js` (`expiringPlayers`, `weeksLeftLabel`) y `src/features/squad/SquadScreen.jsx`.
- **TDD:** 4 pruebas de dominio (coincide con el aviso, semanas y urgencia, exclusiones, etiquetas) y 3 de interfaz (panel, volver a ver todo, insignia sin aviso).
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
