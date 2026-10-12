# Compartir más momentos del club

- `src/domain/momentShare.js`: `momentCard` arma titular, dato principal, texto y enlace para cuatro momentos: campeonato, ascenso, fichaje y balance de la temporada. Enlace a `/demo?utm_source=share&utm_medium=<momento>`.
- `src/lib/shareMatch.js`: se extrajo `shareImage` (imagen → texto → portapapeles) que ahora usan `shareMatchResult` (sin cambios de comportamiento) y el nuevo `shareMoment`; `drawMomentCard` pinta la tarjeta de 1080 x 1350.
- `ShareMomentButton` (nuevo): botón reutilizable; mide `share_moment` (con el tipo de momento).
- Dónde aparece: gala de fin de temporada (campeonato si salió campeón, ascenso si subió, y siempre "Compartir mi temporada") y el cierre de un fichaje en el Mercado.
- Tests: `momentShare` (6), `shareMatch` (3 nuevos), `shareMomentButton` (1).
- Sin datos personales ni cambios de base de datos.
