# minijuegos-azar

Los minijuegos del partido dejan de ser siempre iguales.

- **Antes:** en el penal y el tiro libre la pelota iba siempre al mismo punto de la zona apuntada, y la barra de potencia arrancaba igual cada vez; en el remate en contra la pelota salía siempre del centro con el mismo tiempo; en el córner no había animación.
- **Ahora:**
  - **Penal / tiro libre:** la pelota llega a un punto distinto cada vez según la zona y la calidad del golpe. Un buen golpe es preciso y va al piso o al ángulo; uno flojo se desparrama; uno muy malo se va afuera (al costado o por arriba), como ya cuenta el relato. La barra de potencia arranca en otro punto y a otra velocidad cada vez.
  - **Remate en contra:** sale de un lado distinto, tarda 0,7 a 1 s según el caso, entra a otra altura y se corre algo dentro de su zona. La calidad de la reacción se mide contra el tiempo real de ese remate.
  - **Córner:** el centro vuela y cae en un punto distinto dentro de la zona elegida.
- **Sin cambios en el resultado:** gol, atajada o tribuna los sigue decidiendo el motor con la zona y la calidad. Es solo la animación. Los tiempos de espera no cambian.
- **Dónde:** `src/domain/shotPath.js` (reglas puras con azar inyectable) y los componentes `PenaltyGoal.jsx`, `SaveReflex.jsx` y `CornerPick.jsx`.
- **TDD:** `tests/domain/shotPath.test.js` y `tests/ui/penaltyShoot.test.jsx`.
- **Quality gates:** pruebas unitarias y BDD en verde, ESLint sin avisos.
