# historias-liga

Seis historias nuevas de política de liga (cuatro capítulos cada una, con marcas de recuerdo y desenlace con variantes).

- **Torneo de dos grupos:** la federación inventa una "zona de la gloria" y una "zona del consuelo", con sorteo opaco, puntos que valen la mitad y una final a las tres de la tarde.
- **Las reglas del descenso:** a mitad de campeonato cambia el reglamento y se salvan los amigos del presidente de la federación; hay cena con carpeta, una grabación y una última fecha con el descenso en juego.
- **El horario de la tele:** partidos los lunes a las 22:30, hinchas en la puerta, un suplente dormido en cámara y una renovación que llena la caja y vacía la popular.
- **El árbitro de confianza:** designación sospechosa, penal dudoso, la libretita del veedor y una citación al tribunal de disciplina.
- **La clausura sorpresa:** un inspector con un sello, la popular cerrada, un certificado que aparece en un cajón y la reapertura.
- **La ventana que se cerró antes:** la federación adelanta el cierre de pases justo cuando ibas a fichar.
- **Personaje:** Don Anselmo Ferraro, presidente de la federación (ficticio), que reaparece en varias historias.
- **Alcance:** son relatos con consecuencias en hinchada, dirigencia, vestuario, caja, reputación y favores. No cambian el formato real de la liga ni los descensos.
- **Dónde:** `src/domain/arcCatalogLiga.js`, sumado al final de `ARC_CATALOG`. Sin migraciones (categorías `BOARD_PRESS` y `FINANCIAL_CRISIS`, ya permitidas).
- **TDD:** `tests/domain/arcsLiga.test.js` (contenido pedido, estructura, efectos conocidos, ninguna opción gratis y sorteo).
- **Quality gates:** unitarias y BDD en verde, ESLint sin avisos.
