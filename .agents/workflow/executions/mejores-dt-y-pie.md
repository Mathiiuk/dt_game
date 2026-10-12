# Tabla "Los mejores DT" y pie de diario

**Tabla pública (portada):** los cinco DT con más **puntos de legado** de toda su carrera.
- Base de datos (aditivo, aplicado en producción): `public_top_managers(p_limit)`, `security definer`, ejecutable sin sesión. Calcula en vivo lo mismo que la proyección al Salón de la Fama del juego (`getLiveManagerProjection`): títulos de liga × 400 + continentales × 800 + victorias × 15 + efectividad % × 20 + reputación × 10. Entran DT con al menos 10 partidos (con pocos, la efectividad infla el puntaje). Devuelve solo nombre, puntos, títulos y victorias; máximo 20 filas. Probada con la clave pública (devuelve filas; el límite se acota).
- Cliente: `src/lib/publicRanking.js` (fetch directo, sin cargar Supabase ni la sesión; `src/lib/supabaseEnv.js` comparte URL y clave con el cliente del juego) y `TopManagersTable`: reserva el lugar mientras carga, invita a ser el primero si no hay nadie y no muestra nada si falla.
- Ubicación: columna derecha de la portada en escritorio (sobre "En esta edición") y debajo del pensamiento del día en el celular.
- Privacidad: se agregó la sección "Tabla pública de los mejores DT" en la política (qué se publica, cómo pedir que se quite, y que al eliminar la cuenta se deja de aparecer).

**Pie:** filete doble, marca a un costado y enlaces agrupados con título (Juego, Guías, Soporte, Legal); en escritorio van en columnas (las guías en dos), en el celular cada grupo en su fila. Mismos enlaces que antes.

Tests: `publicRanking` (4), `topManagers` (4), `top-managers-sql` (5); los de portada y pie siguen verdes.
