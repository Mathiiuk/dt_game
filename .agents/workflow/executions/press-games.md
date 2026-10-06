# press-games

Prensa: "Titular o fake" y "Bingo del DT", después de la rueda de prensa y de "Completá la frase".

- **Titular o fake** (`headlineRound`): dos titulares verdaderos (el resultado, respetando de qué lado jugás, y la figura del partido o un dato del marcador) y un rumor inventado de 8 posibles, mezclados. Acertar es desmentir a tiempo (+1 dirigencia); errar deja correr el rumor (-1 hinchada). Una vez por conferencia.
- **Bingo del DT:** cartilla de 9 clichés por club y temporada (12 posibles, los de las frases de manual), guardada en `club_climate.press_bingo` y reiniciada cada temporada. Elegir la frase de manual tacha su cliché; línea nueva +2 hinchada y +1 dirigencia; cartilla llena +4 y +2 más. Repetir un cliché no vuelve a cobrar.
- Migración `migration_press_bingo.sql` aplicada. `pressApi.getBingo/markBingo/applyHeadline`.
- Los titulares se arman una sola vez aunque la pantalla se redibuje (dependen de los datos y no del objeto).
- Tests: dominio (cartilla, líneas, premios, titulares), API (temporadas y premios) y sala.
- Nota: el servidor sigue sin verificar estos premios (son de ±1 a +6 puntos de clima); no mueven plata.
