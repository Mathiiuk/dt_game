# Test Plan — arcade-match-squad-polish

## 1. Objetivo
Validar las mejoras visuales, de rendimiento y de interactividad solicitadas:
- Escudos vectoriales arcade SVG con heráldica tradicional argentina (Opción A).
- Corrección de mojibake / caracteres corruptos UTF-8 en todas las pantallas.
- Estadísticas de partido dinámicas acumuladas en vivo minuto a minuto.
- Órdenes/gritos y sustituciones con modal centrado y pizarra táctica interactiva.
- Post-partido con carga paralela no bloqueante y diseño sin scroll en escritorio.
- Pantalla de plantel (/squad) rediseñada con mayor espacio y jerarquía.

## 2. Riesgos a validar
- Que los escudos SVG se adapten y no rompan clubes sin colores explícitos.
- Que las sustituciones interactivas mantengan la compatibilidad con los tests de accesibilidad.
- Que las estadísticas en vivo no arrojen NaN o desincronización de posesión.
- Que el post-partido cargue inmediatamente sin congelar la UI esperando la rueda de prensa.
- Que la tabla y tarjetas de plantel conserven todas las acciones y roles accesibles.

## 3. Unit tests
- [x] `tests/ui/substitutionsPanel.test.jsx`: Selección de quién sale y quién entra, deselección y estado de cambios agotados.
- [x] `tests/ui/postMatchPress.test.jsx`: Omitir rueda de prensa, cálculo de multas y flujo de resumen.
- [x] `tests/ui/squadScreen.test.jsx`: Resumen, tabla accesible, filtrado por líneas, búsqueda sin tildes, capitanes, transferencias y préstamos.
- [x] Suite completa de pruebas unitarias (`pnpm test`).

## 4. BDD tests
- [x] `.agents/workflow/features/arcade-match-squad-polish.feature`: Resolución heráldica de patrones de escudos (River, Boca, Racing, Vélez, Newell's, Ferro) y métricas de plantel.
- [x] `pnpm test:bdd`: 67 escenarios ejecutados exitosamente con Cucumber.

## 5. Quality Gates
- [x] Linting (`pnpm lint`): Máximo de advertencias dentro del umbral (`--max-warnings=13`).
- [x] Compilación / Build (`pnpm build`): Build Vite completado sin errores.
- [x] Verificación de tareas AGT (`agt task:verify arcade-match-squad-polish`).

## 6. Evidencia requerida
- comando: `pnpm test`, `pnpm test:bdd`, `pnpm lint`, `pnpm build`
- resultado: Todos los checks aprobados.
- entorno: Windows PowerShell / Node.js.

## 7. Resultado
`PASSED`
