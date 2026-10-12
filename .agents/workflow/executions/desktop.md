# Modo escritorio

- **Claro por defecto para todos:** `DEFAULT_THEME = 'light'` (`src/lib/theme.js`) y el script de arranque de `index.html` (que sigue coincidiendo con `theme.js`, hay prueba). Quien ya había elegido oscuro o automático lo conserva.
- **Menú de Ajustes en escritorio:** botón "Ajustes" en la barra lateral que abre un panel (`SettingsSheet`) con Apariencia (claro/oscuro/automático), dificultad, avisos, privacidad y el tutorial. En el celular siguen en "Más".
- **Títulos de página en escritorio:** `PageHeader` esconde a la vista el h1, la volanta y la bajada desde `lg` (`lg:sr-only`): siguen en el documento para lectores de pantalla y el h1 nunca desaparece; solo quedan las acciones, a la derecha. Los títulos de tarjetas y secciones (h2/h3) se mantienen. Las páginas públicas (indexables) no usan `PageHeader` y no cambian.
- **Ancho:** pantallas de 6xl llegan a 96rem en pantallas grandes; Calendario, Tabla, Copa y Bitácora a 7xl/6xl desde `xl`; Calendario en dos columnas (próximos / resultados); Amigos a 6xl con tabla y ajustes lado a lado y travesuras junto al muro; Reto del día con la tabla al costado una vez jugado.
- **Skill `sep-indexing-Search-visibility`:** no está en el repositorio (solo en la carpeta local del usuario); se usó `seo-growth-expert` y se verificó que la prueba de títulos/SEO pública no cambia. Pendiente: subir la skill a `.agents/skills/` para aplicarla.
- **Sin verificar:** capturas de escritorio con datos reales (las pantallas del juego necesitan sesión); revisar a 1280, 1440 y 1920 px.
