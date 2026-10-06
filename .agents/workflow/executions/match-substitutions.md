# match-substitutions

Cambios de jugadores durante la pausa del partido.

- `domain/substitutions.js`: banco, validaciones (tope de 5, sin reingreso, solo aptos) y once nuevo; el que entra juega en el puesto del que sale con su media en ese puesto.
- `matchEngine.simulateMatch` acepta `changes` y `matchEngineApi.replayWithChanges` rejuega el partido con la misma semilla: hasta el minuto del cambio todo queda igual, desde el siguiente rinde el nuevo once (los que entran llegan frescos).
- `SubstitutionsPanel` en la pausa; el resultado se guarda en sessionStorage para que recargar la página no deshaga los cambios; los que entran cuentan como participantes (`starterIds`).
- Tests: dominio, motor (idéntico hasta el cambio, mejora el resultado) y panel.
