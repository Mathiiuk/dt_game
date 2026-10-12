# Pie liviano, subpáginas como notas de diario, demo y 404

- **Pie:** ahora solo lo esencial (14 enlaces: Juego, Guías —índice y tres destacadas—, Soporte y Legal), marca a un costado con filete doble y cuatro columnas en escritorio. La marca `featured` en `publicPages.js` decide qué entra. El resto de las páginas se alcanza desde los índices y los "Seguí leyendo": la prueba `publicReach` exige que **toda página pública esté a dos clics como máximo del pie**.
- **Subpáginas** (`InfoPage`: FAQ, guías, cómo jugar, tácticas, soporte, legales…): kicker rojo con la sección, título en slab, bajada con filete, subtítulos con filete, tarjeta final con filete doble y "Seguí leyendo" como lista plana con flecha.
- **Demo** (`DemoScreen`): kicker "Demo gratis · sin cuenta", título en slab, medidores como tira con cifras Barlow y filete doble, cada decisión en recuadro de diario, minutos del relato en azul, "Los diarios de mañana" como titulares en slab y cierre en recuadro. Mismos textos, botones y eventos.
- **404:** "Error 404 · Edición no encontrada", cifra y titular en slab.
- Capturas Chromium (390 claro / 1280 oscuro) de FAQ, guía, demo, 404 y privacidad: un solo H1, sin desborde horizontal.
- Tests: `publicReach` (3), pie y guías actualizados; resto verde. `index.html` regenerado.
