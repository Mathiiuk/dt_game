# clasico-activo

Se activa `isDerby` en la economía y en la prensa.

- **Antes:** `isDerby` existía en la taquilla, la hinchada, las consecuencias y la prensa, pero ningún partido lo calculaba: valía siempre falso.
- **Ahora:** el resultado del partido lleva `isDerby` (el mismo criterio del duelo de declaraciones: par de clubes estable, 1 de cada 7 rivales, ida y vuelta). Helper `fixtureIsDerby` en `src/domain/derbyDuel.js`.
- **Qué cambia en el juego, solo en clásicos:**
  - **Taquilla:** demanda x1,45 en los partidos de local (`settle_gate` y `matchAttendance`).
  - **Hinchada (apoyo):** ganar +8, empatar -2, perder -10 (en lugar de ganar/perder normal).
  - **Consecuencias:** perder el clásico resta 4 más de hinchada ("duele el doble"); ganar deja la ovación histórica en el registro de la hinchada.
  - **Prensa:** la pregunta del clásico pasa a ser la 2ª (la sala hace 2); la de la figura baja a la 3ª. Antes se guardaba como 3ª o 4ª y nunca se hacía.
- **Sin migraciones:** `settle_gate` ya recibía `p_is_derby`.
- **TDD:** pruebas de `fixtureIsDerby` (local, visitante, sin datos) y de la pregunta del clásico como 2ª pregunta.
- **Quality gates:** pruebas unitarias y BDD en verde, ESLint sin avisos.
