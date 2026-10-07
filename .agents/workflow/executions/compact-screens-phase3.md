# Reporte de Ejecución: compact-screens-phase3 (Fase 3 - Pantallas Compactas)

## Resumen
Se implementaron de forma integral todos los puntos comprometidos en la Fase 3 del roadmap:
- **B9 (Selector de dificultad)**:
  - Se retiró el selector del Inicio/Dashboard para evitar confusión.
  - Se creó el componente reutilizable `DifficultySelector.jsx` con descripciones claras de cada nivel (Relajado, Normal, Realista).
  - Se agregó la selección de dificultad al fundar el club en `CreateClubWizard.jsx`.
  - Se habilitó la modificación de dificultad desde "Ajustes de partida" en `MoreScreen.jsx` junto a Cerrar sesión.
- **B11 (Títulos que generan scroll)**:
  - Se agregaron clases `truncate` y `break-words` a cabeceras de página y wizards (`page-header.jsx`, `wizard.jsx`).
- **B12 (Botones fijos de asistentes)**:
  - Se extendió el anclaje inferior fijo de los botones en los wizards (`wizard.jsx`) hasta resolución `lg` (1024px) para cubrir el rango intermedio 640px-1024px.
- **B13 (Auth compacto y sin logo reCAPTCHA)**:
  - Se ocultó el badge flotante de reCAPTCHA mediante CSS en `index.css` manteniendo los textos legales requeridos.
  - Se compactaron márgenes y paddings en `AuthScreen.jsx`.
- **M4 (Calendario compacto y con rivales)**:
  - Se enriqueció la API de calendario (`calendar.js`) para resolver los nombres de los clubes rivales y la condición de local/visitante.
  - Se añadieron filtros "De local" y "De visitante" en `calendarView.js`.
  - Se rediseñó `CalendarScreen.jsx` con tres vistas:
    1. *Próximos y resultados* (por defecto): Muestra la semana en curso, los próximos 5 partidos y los resultados recientes, siempre indicando el nombre del rival.
    2. *Por mes*: Grilla mensual compacta donde las semanas libres ocupan una sola línea.
    3. *Semanas*: Las 52 semanas con todos los filtros.
- **M8 (Prensa post-partido compacta y rápida)**:
  - Se limitó la conferencia a 2 preguntas clave (`PressRoom.jsx`).
  - La reacción de la sala cuenta con auto-avance tras 2.5s además del botón manual.
  - Se rota a un único minijuego por conferencia (Frase o Titular).
  - El Bingo del DT se presenta como una barra de avance plegable con botón para ver la cartilla completa.
  - La transcripción completa queda plegada bajo un desplegable `<details>` para evitar scroll en móviles.

## Quality Gates
- **Tests unitarios**: 153 suites / 1264 tests pasando (100% verde).
- **Tests BDD**: 57 escenarios / 176 pasos pasando (100% verde).
- **ESLint**: 0 errores, 13 advertencias (dentro del límite estricto `--max-warnings=13`).
