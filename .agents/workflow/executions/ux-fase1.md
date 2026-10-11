# Ejecución: UX fase 1 (primeros pasos)

- Rama: `feat/ux-fase1`. Roles: product-designer (UX, accesibilidad, mobile), frontend-engineer, qa-engineer (TDD).
- **Tu próximo paso** (`NextStepCard`, `src/domain/firstSteps.js#nextStep`): una sola tarjeta en el Inicio con lo que conviene hacer ahora (cierre pendiente, fin de temporada, decisiones, plantel sin gente, debut sin ver la táctica, día de partido, avanzar). Solo muestra botón cuando la acción no está ya en el botón principal.
- **Primera misión** (`FirstStepsCard`): tres pasos para cuentas nuevas (revisar la táctica, resolver una decisión, jugar el primer partido) con avance, se puede ocultar. Lo hecho se guarda por usuario en el navegador (`firstStepsStore`); ver la pizarra y resolver una decisión lo tildan.
- **Portada**: un solo botón principal. Visitante nuevo: "Probar la demo gratis" (sin registro) y "Crear mi carrera" como secundario; con carrera: "Continuar carrera". Prerender de la portada regenerado.
- **Accesibilidad**: los botones chicos pasan a 44 px en pantallas táctiles (`pointer-coarse`). El movimiento reducido ya estaba cubierto de forma global (`index.css`) y los contrastes de los tokens ya eran AA: no se tocó.
- Pruebas: `firstSteps.test.js`, `dashboardFirstSteps.test.jsx`, `homeLanding.test.jsx` (ampliado).
