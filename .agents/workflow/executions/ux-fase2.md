# Ejecución: UX fase 2

- Rama: `feat/ux-fase2`. Roles: product-designer, frontend-engineer, qa-engineer (TDD).
- **A. Feedback al decidir:** `effectChips` ahora trae sentido, fuerza (leve, fuerte, enorme) y cuánto llenar la barra; `describeEffect` da la frase para lectores de pantalla. Componente nuevo `EffectMeters` (ícono, barra, número con signo, entrada escalonada) usado en la pantalla completa de la historia y en el resultado del Inicio.
- **B. Resultado compartible:** `domain/matchShare.js` (texto y enlace a la demo con `utm_source=share`), `lib/shareMatch.js` (tarjeta de 1080 x 1350 en canvas, comparte imagen si el dispositivo lo permite, si no texto, si no copia) y botón "Compartir resultado" en el resumen del partido. Evento `share_match`.
- **C. Sala de amigos por pasos:** `RoundPanel` en pestañas (Planteo, Prode, Listos) con el aviso "Te faltan N pasos", abre en el primer paso pendiente. Sin cambios de API ni SQL.
- Verificación visual: Chromium a 360 y 390 px, sin desborde horizontal.
- Pruebas: `storyFlavor`, `effectMeters`, `matchShare`, `shareMatch`, `roundSteps`, `friendsScreen`, `postMatchPress`, `storyStage` (actualizados a los textos accesibles nuevos).
