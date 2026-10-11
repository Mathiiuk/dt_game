# Ejecución: tutorial de bienvenida con React Joyride

- Rama: `feat/tutorial-joyride`
- Alcance: recorrido de 15 pasos por todas las secciones del juego, solo la primera vez que una cuenta nueva entra (cuentas creadas desde 2026-10-11), con opción de saltearlo; se recuerda en los metadatos de la cuenta y en el navegador; se repite desde "Más".
- Archivos: `src/features/tutorial/{tourSteps,tourState,tour}.js`, `GameTour.jsx`; `data-tour` en `AppShell.jsx`; botón en `MoreScreen.jsx`; eventos `tutorial_start`/`tutorial_end` en `analytics.js`.
- Pruebas: `tests/domain/tutorial.test.js`, `tests/ui/gameTour.test.jsx`.
- Compuertas: lint sin avisos, vitest (237 archivos), BDD (70 escenarios) y build con prerender: todo en verde.
- Pendiente de revisión humana: probar el recorrido en un celular real con una cuenta nueva.
