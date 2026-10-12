# Rediseño "Diario deportivo" — rama 1: tema base

**Decisiones del usuario:** el tema sigue al sistema (con interruptor en Más) y la web pública también cambia. Se implementa en 4 ramas; esta es la primera (infraestructura).

**Qué trae**
- `src/index.css`: tokens en hex del tema claro ("papel") y oscuro ("noche de redacción", bajo `data-theme="dark"` + respaldo `prefers-color-scheme` sin JS); nuevos `primary` (azul: acción, enlaces, lo activo), `warning-fg`, `danger-fg`, `gold-fg`, `pitch`; `accent` queda para éxito (verde). Radios y sombras más chicos. Titulares (`h1–h3`) en Roboto Slab (`@fontsource/roboto-slab` 700/800, subset latin); `font-display` queda para cifras y etiquetas (Barlow Condensed).
- `src/lib/theme.js`: `getStoredTheme`, `resolveTheme`, `applyTheme`, `setTheme`, `useTheme`; clave `vestuario-theme` (valor nuevo: no necesita migración).
- `index.html`: script que fija `data-theme` y `theme-color` antes de pintar (sin parpadeo). `tests/static/themeBoot.test.js` comprueba que da lo mismo que `theme.js`.
- `ThemeToggle` (Más → Apariencia: Automático / Claro / Oscuro).
- Primitivas `ui`: `Button` (azul), `Card` (+ `masthead` con filete doble y `Kicker`), títulos en slab (`CardTitle`, `PageHeader`, `Dialog`, `EmptyState`, `Wizard`), chips, pestañas, campos, interruptor y pager con `primary`.
- `tests/static/themeContrast.test.js`: AA (4,5:1) en 27 pares de color y en los dos temas (se ajustó el verde del tema claro a `#2C7449` para llegar a AA sobre el papel).

**Salida escalonada:** mientras las pantallas no estén migradas (ramas 2 y 3) el tema por defecto es **oscuro** (`DEFAULT_THEME = 'dark'`); quien elija Claro o Automático en Más ya puede probar el nuevo papel. La rama 4 pasa el defecto a `'auto'`.

**Tests:** `theme`, `themeBoot`, `themeContrast`, `themeToggle`; prerender de la portada regenerado (`HOME_PRERENDER=write`). Captura de las piezas base en claro y oscuro revisada.
