# Rediseño "Diario deportivo" — rama 3: resto del juego

- **Acción vs. éxito:** botones principales, estados activos/seleccionados, enlaces al pasar el mouse y anillos de foco pasan de `accent` (verde) a `primary` (azul) en ~35 archivos (partido, post-partido, club, carrera, amigos, historias, errores, avisos). `accent` queda para lo positivo (barras, cifras que suben, "ganó").
- **Colores fijos de Tailwind a tokens:** `emerald/amber/rose/red/blue/sky/orange/zinc` → `accent/gold/danger/primary/warning/surface/fg-*` (37 archivos), para que se lean bien en el tema claro. `text-black` sobre dorado → `gold-fg`.
- **Literales `oklch()`:** rayado de arco (reflejo y penales) y fondo de las historias con `color-mix` de tokens; cancha de sustituciones con `--color-pitch`.
- **Tutorial (Joyride):** colores desde variables del tema.
- Sin cambios de datos ni de base. Banderas, escudos de clubes y el logo de Google se mantienen.
- Pendiente a rama 4: `Atmosphere` y la web pública.
