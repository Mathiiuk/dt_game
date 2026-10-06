# Reporte de Ejecución: characters
- **Rama**: `feat/characters` | **Estado**: `DONE`
- **Backlog cerrado**: personajes con nombre y memoria.
- **Datos**: `club_climate.characters` (jsonb, migración `climate_characters` aplicada): líder de la barra (`el Oso`, `el Gringo`...), presidente y periodista con su medio, sorteados una vez por club (deterministas) y que recuerdan lo que pasó.
- **Dominio** (`domain/characters.js`): `generateCharacters`, `ensureCharacters` (no pisa la memoria), `renderText` / `renderTemplate` (marcadores `{Barra}`, `{barra}`, `{presidente}`, `{periodista}`, `{medio}`; sin personajes usa nombres genéricos y nunca deja llaves), `rememberBarraVisit` (desde la segunda vez el evento dice "ya vino antes" y luego cuántas veces), `adjustGrudge` y `rumorBoost`.
- **Efectos**: los pedidos de la barra, la reunión de emergencia, el favor del presidente, la presión del presidente y el rumor de despido nombran a los personajes. La barra cuenta sus visitas al subir de etapa. **Prensa**: plantar al periodista le suma rencor y con rencor el rumor tras omitir la conferencia es más probable (+5% por punto, hasta +25%); dar la cara baja el rencor un punto. La tarjeta de clima muestra quién lidera la barra y cuántas veces vino.
- **Tests**: `characters.test.js` (10), 4 casos en `climateWeek.test.js`, 3 en `pressSkip.test.js`; suite completa verde (848).
