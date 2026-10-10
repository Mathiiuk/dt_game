# Textos de historias cortados y mal armados

## Problema
Las historias salían con texto cortado: el partidor de momentos (`splitBeats`) se comía los signos `¡` y `¿`, convertía en globo cualquier cita a mitad de oración (dejando frases sin cerrar y puntos/comas sueltas), partía números como `$1.000` y no reconocía comillas curvas. Además `StoryStage` no tenía scroll interno y el título se cortaba con `truncate`.

## Cambios
- `src/domain/storyFlavor.js`: `splitSegments` solo hace globo con una cita que ocupa la oración entera (al inicio, tras punto o dos puntos); la cita inline queda dentro de la narración; la narración que cuelga de un globo pierde la puntuación suelta y arranca en mayúscula; comillas `“ ” « »`. Nuevo `splitSentences` (no corta dentro de citas ni en números con punto, conserva `¡¿`).
- `StoryStage.jsx`: scroll interno en lectura y opciones (`overflow-y-auto` + centrado seguro) y título con `break-words`.
- Tests: casos nuevos en `tests/domain/storyFlavor.test.js` y barrido de TODAS las historias (`ARC_CATALOG` y `LEAGUE_ARCS`): ningún momento empieza con puntuación, ningún marcador `{x}` sin reemplazar, y no se pierde ninguna palabra.
- El script de simulación del año queda detrás de `SIM=1` para no correr en `npm test`.
