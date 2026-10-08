# Test Plan — auth-pwa-session-security

## 1. Objetivo
Validar de forma exhaustiva la persistencia de sesión en la PWA y navegadores móviles, el refresco proactivo de tokens tras suspensión/recuperación de visibilidad, la navegación segura sin atrapar al usuario en pantallas de login con el botón de retroceso (Back button), y el cumplimiento del 100% de los Quality Gates.

## 2. Riesgos a validar
- Cierre intempestivo de sesión al suspender o minimizar la app en móviles / PWA.
- Loops o trampas de navegación al presionar el botón "Atrás" cuando la sesión ya está iniciada.
- Desincronización del estado de autenticación de Supabase ante tokens expirados.
- Regresiones en tests existentes de autenticación, Google OAuth y shell de navegación.

## 3. Unit tests
- [x] `tests/ui/authPersistence.test.jsx`:
  - `setupSessionVisibilityListener suscribe y reanuda auto-refresh al pasar a visible`
  - `setupSessionVisibilityListener intenta refreshSession si getSession devuelve null en frío`
  - `authApi.getSession reintenta proactivamente con refreshSession si el token expiró`
  - `authApi.logout limpia los datos cacheados de sesión en localStorage`
  - `AuthScreen redirige inmediatamente a /dashboard con replace: true si el usuario ya tiene sesión`
- [x] `tests/ui/authScreen.test.jsx` (6 tests pasados)
- [x] `tests/ui/authGoogle.test.jsx` (7 tests pasados)

## 4. Integration tests & BDD
- [x] `.agents/workflow/features/auth-pwa-session-security.feature` (3 escenarios `@auto` pasados)
- [x] `tests/bdd/steps/auth-pwa-session-security.steps.js` (70 escenarios globales en verde)

## 5. Regression tests
- [x] Suite completa de Vitest: 158 test files pasados, 1319 tests pasados.
- [x] Suite de Cucumber BDD: 70 escenarios pasados, 220 pasos en verde.

## 6. Security checks
- [x] Configuración de Supabase con PKCE activado y aislamiento de clave de almacenamiento (`dt_supabase_auth_token`).
- [x] Sanitización y borrado de credenciales cacheadas en `logout()`.
- [x] Rate limiting local preservado y auditoría de accesos fallidos.

## 7. Quality Gates
- [x] `pnpm test` -> 158 passed (1319 tests).
- [x] `pnpm test:bdd` -> 70 passed (220 steps).
- [x] `pnpm lint` -> 0 errores, 12 warnings (límite máximo: 13).
- [x] `pnpm build` -> Éxito en 1.98s con Service Worker generado (dist/sw.js).

## 8. Evidencia requerida
- **Unit & Integration:** `vitest run` completado en 103.82s (1319 tests passed).
- **BDD:** `cucumber-js --tags @auto` completado en 0.076s (70 scenarios passed).
- **Lint:** `eslint . --max-warnings=13` exit code 0 (12 warnings, 0 errors).
- **Build:** `vite build` compilado exitosamente y PWA v1.3.0 generada.

## 9. Resultado

`PASSED`
