# Ejecución: fix-ui-copy-and-errors (B10)
- `scripts/fix-copy.cjs` (con las reglas compartidas en `scripts/copy-rules.cjs`): barrido de textos de la interfaz. Aplicado: 147 líneas en 31 archivos. Títulos y etiquetas en minúscula salvo la primera palabra y los nombres propios ("Cuerpo técnico actual", no "Cuerpo Técnico Actual"), 8 "&" pasados a "y", y 51 errores crudos (`toast.error(e.message)`) ahora pasan por `friendlyError` (castellano, sin jerga de la base).
- A mano: "Tier 5" -> "división 5", "dashboard" -> "inicio", "fitness"/"fit" -> "condición física".
- `tests/static/copy.test.js` (4 comprobaciones) impide que vuelvan: sin "&", sin Title Case, sin errores crudos y sin términos en inglés comunes.
- Fuera de alcance (a propósito): nombres de logros, hitos y clubes guardados como datos (por ejemplo "Bautismo de Fuego", "Club Atlético Mitre") conservan su mayúscula de nombre propio. Las clases `uppercase` de etiquetas chicas (estilo de rótulo) se mantienen.
- 382 tests en verde.
