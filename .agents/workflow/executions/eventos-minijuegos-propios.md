# eventos-minijuegos-propios

Cada tipo de evento tiene su minijuego propio de desafío de pista.

- **Antes:** los desafíos de pista eran compartidos (memoria, insistencia, verdadero o falso, reflejos y, solo en crisis de plata, billetes).
- **Ahora:** además hay uno propio por tipo de evento, que entra dos veces en el sorteo del evento (sale más seguido que los compartidos), siempre estable para el mismo evento:
  - **Comunidad y barrio, "El cántico":** un aro se cierra sobre un círculo y hay que tocar justo cuando llega, cuatro golpes con ritmo parejo pero no clavado; con tres se gana.
  - **Vestuario, "Calmar al vestuario":** la tensión sube sola y hay que tocar para bajarla y sostenerla en la zona verde; 5,5 s de los 9 que dura.
  - **Dirigencia y prensa, "Armá el titular":** las palabras de un titular vienen mezcladas y se tocan en orden; un error se perdona, el segundo pierde.
  - **Crisis de plata, "Cuadrar la caja":** elegir los gastos que suman justo lo que falta cubrir (siempre hay solución); dos intentos, con aviso de cuánto faltó o sobró.
- **Igual que los demás:** ganar da la pista (se ven los efectos de cada opción), perder o pasar es decidir a ciegas; no cuesta nada.
- **Accesibilidad:** el aro del cántico es el juego en sí y no se acelera con "menos movimiento".
- **Verificado a ojo** en navegador a 390 px.
- **Dónde:** reglas en `src/domain/storyStage.js` (`CATEGORY_CHALLENGES`, `buildChant`, `calmTick`, `buildHeadline`, `buildBalance`...), componentes en `src/features/dashboard/StoryCategoryGames.jsx`, animación en `src/index.css`.
- **TDD:** 16 pruebas de interfaz (`tests/ui/storyCategoryGames.test.jsx`) y 13 de dominio nuevas en `tests/domain/storyStage.test.js`.
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
