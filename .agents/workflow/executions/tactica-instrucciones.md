# Táctica: instrucciones cómodas y con efecto real

## Hallazgo
Solo la mentalidad Ofensiva/Defensiva/Ataque total y el ritmo rápido/lento pesaban en el partido. "Muy defensiva", "Equilibrada", el estilo de pase y la intensidad de presión se guardaban pero no hacían nada.

## Cambios
- `src/domain/tacticalStyle.js` (nuevo): una sola fuente de efectos (multiplicadores de ataque, defensa y mediocampo + desgaste físico) para mentalidad, ritmo, presión y estilo de pase; `describeEffect`/`effectOf` los cuentan en palabras; 5 estilos listos (`TACTIC_PRESETS`) y `presetOf`.
- `matchEngine.js` (`applyTactics`): usa `tacticMultipliers`, así "muy defensiva", pase y presión ahora se notan (posesión, ataque, defensa, desgaste); acepta los nombres viejos en castellano.
- `TacticsScreen.jsx`: "Estilos listos" (Equilibrado, Posesión, Contraataque, Todo arriba, Cerrar el partido) que fijan las cuatro instrucciones de un toque; cada opción es un botón grande con su efecto ("+20 % ataque, −15 % defensa"); resumen "Así juega tu equipo"; sin chips que se envuelven.
- Tests: `tests/domain/tacticalStyle.test.js`, `tests/api/matchEngine.test.js` (el efecto llega al partido) y `tests/ui/tacticsScreen.test.jsx` (efectos, estilos y resumen).
