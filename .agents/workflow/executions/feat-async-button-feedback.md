# Ejecución: feat-async-button-feedback
- `useAsyncClick` (hook): si el `onClick` devuelve una promesa bloquea el botón al instante (ref, sin esperar al render), muestra el estado pendiente y libera al terminar o fallar; un doble clic ejecuta una sola vez y no actualiza estado si el botón se desmontó.
- `Button` lo usa solo: cualquier `<Button onClick={async ...}>` ya muestra spinner y no se puede apretar dos veces. Nuevo `AsyncButton` para `<button>` con diseño propio.
- `scripts/asyncify-buttons.cjs` convirtió 13 botones con acciones asíncronas (reuniones y charlas del vestuario, infiltraciones, obras del estadio, pedido de fondos, nueva dinastía, rueda de prensa).
- Nuevo `tests/static/syntax.test.js`: compila cada archivo de `src` (141 comprobaciones) para detectar errores de sintaxis tras cambios masivos, ya que el build local no corre.
- Verificado en el navegador: doble clic en "Despedir" abre un solo diálogo, el botón queda bloqueado con spinner y se libera al cancelar.
- 209 tests + 141 de sintaxis.
