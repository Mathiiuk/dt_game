# Eventos sueltos con presentación de historia

## Cambios
- `Dashboard.jsx` (`EventCard`): los eventos sueltos (Comunidad y barrio, vestuario, dirigencia, crisis de plata) se presentan igual que las historias: texto por momentos (`StoryText`), opciones al terminar de leer y "¿Qué hacés?". Se quitó el botón "Jugar"; queda un ícono "Abrir a pantalla completa" para abrir el evento con su minijuego. Las historias (capítulos `ARC_`) conservan insignia, capítulos y título.
- `StoryStage.jsx`: los eventos sueltos también se leen de a momentos (`splitBeats`).
- `chapterOf` e `isArcEvent` quedaron en un solo lugar (`src/domain/storyStage.js`); se borraron las copias de Dashboard y StoryStage.
- Tests actualizados: `dashboardEvents.test.jsx` (sin "Jugar", nuevo caso de lectura) y `storyStage.test.jsx`.
