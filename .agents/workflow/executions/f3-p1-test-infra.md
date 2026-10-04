# Reporte de Ejecución: f3-p1-test-infra
- **Rama**: `feat/f3-p1-test-infra` | **Estado**: `DONE`
- **Implementación**: Vitest 5 + jsdom + Testing Library (react, dom, jest-dom, user-event); `vitest.config.js` independiente de `vite.config.ts` (sin PWA ni SWC, por lo que corre en cualquier entorno); scripts `npm test` y `npm run test:watch`.
- **Tests (21, 7 archivos)**: dominio de contratos y estados de fixture (migrados de los scripts `.mjs`), guardia estática de llamadas `xxxApi.fn()` (migrada de `check_api_calls.cjs`), `queryCache` (dedup, TTL, invalidación), `ensureRow`, motor de partidos (determinismo por semilla, marcador entero, posesión 100, superioridad estadística) y niveles/zonas de tabla.
- **CI**: `ci.yml` ya no ignora fallos de tests (`|| echo`); `auto-merge.yml` ejecuta `npm test` antes del build, por lo que un test roto bloquea el merge a `master`.
- **Gate `agt`**: `npx agt task:verify f3-p1-test-infra` → `[PASS] unit_tests -> npm test`.
- **Nota de entorno**: las dependencias se instalaron con pnpm 11 (el `node_modules` local usa su store); `package-lock.json` se regeneró con `npm install --package-lock-only` para que CI (`npm install`) quede coherente.
