# Rediseño "Diario deportivo" — rama 4: web pública y tema automático

- `Atmosphere` (fondo de la portada): sin `oklch()` fijos; reflector azul y viñeta calculados desde los tokens, así funciona en claro y oscuro. Prerender de la portada regenerado.
- **Tema por defecto = automático** (`DEFAULT_THEME = 'auto'` y script de arranque de `index.html`): sigue al sistema; quien ya eligió uno lo conserva.
- `manifest`: `theme_color`/`background_color` `#101521` (pantalla de arranque oscura, sin destello blanco de noche).
- Guías, demo, 404 y páginas legales ya usaban tokens: heredan el tema sin cambios.
- Tests: suite completa verde (2311), `homeSeo`, `themeBoot`, `themeToggle`.
- Pendiente (no hecho): imágenes `og/` siguen oscuras; capturas visuales en celular real.
