# Specification — auth-pwa-session-security

## 1. Objetivo
Fortalecer de forma integral la seguridad de la aplicación, blindar la persistencia de sesión en la PWA (evitando cierres de sesión intempestivos al salir o poner la app en segundo plano), garantizar un flujo de navegación confiable ante el botón de retroceso (evitando quedar atrapado en pantallas de login con sesión activa) y optimizar el reingreso al juego.

## 2. Problema actual
1. **Cierre de sesión al salir de la PWA:** La inicialización de Supabase no contaba con configuración explícita de `storageKey`, `flowType: 'pkce'`, ni manejo proactivo de refresco de tokens al despertar la app (`visibilitychange`). Al suspender la app en móviles, los temporizadores en segundo plano se congelan; al volver tras expirar el token de acceso (~1h) o con red lenta en arranque en frío, `getSession()` retornaba `null` y `GameContext` expulsaba de inmediato al usuario a `/auth`.
2. **Falta de listener reactivo `onAuthStateChange`:** La app no sincronizaba los eventos de sesión de Supabase (`INITIAL_SESSION`, `TOKEN_REFRESHED`, `SIGNED_IN`, `SIGNED_OUT`), provocando desincronizaciones entre el estado global y la sesión real.
3. **Problema con el botón de retroceso (Back):**
   - Si un usuario autenticado presiona "Atrás" desde `/dashboard`, llega a `/auth` porque el login se navegaba sin `{ replace: true }`.
   - Al aterrizar en `/auth`, `AuthScreen` no comprobaba si ya existía una sesión activa y mostraba el formulario de login, desconcertando al usuario.
4. **Seguridad general:** Necesidad de garantizar flujo PKCE seguro, validación y sanitización estricta de credenciales, y persistencia a prueba de fallos de red transitorios.

## 3. Resultado esperado
1. **PWA persistente:** La sesión se mantiene indefinidamente en `localStorage` con clave dedicada y flujo PKCE. Al salir y volver, o al reconectar la red, la sesión se refresca automáticamente sin cerrar la cuenta.
2. **Reingreso y retroceso inteligente:**
   - Si un usuario autenticado llega a `/auth` (por retroceso o URL directa), la app detecta la sesión y lo redirige de inmediato a `/dashboard` (o asistente correspondiente) con `{ replace: true }`.
   - Los ingresos y registros usan navegación `replace: true`, eliminando `/auth` del historial previo al Dashboard.
3. **Seguridad reforzada:** Refresco de token proactivo al volver el foco/visibilidad a la PWA, auditoría resiliente y protección contra ataques por fuerza bruta con rate limit local sanitizado.

## 4. Alcance

### Incluido
- Configuración avanzada de cliente Supabase con PKCE, `storageKey` y persistencia en `src/api/supabase.js`.
- Integración de `onAuthStateChange` y sincronización reactiva en `src/context/GameContext.jsx`.
- Listener de `visibilitychange` y `focus` para refrescar tokens al reanudar la app.
- Detección de sesión activa y auto-redirección en `src/features/auth/AuthScreen.jsx`.
- Sustitución de navegaciones de entrada al juego con `{ replace: true }`.
- Pruebas unitarias y escenarios BDD de persistencia y retroceso.

### No incluido
- Modificación de esquemas de tablas en Supabase.
- Cambios en endpoints de backend de terceros.

## 5. Criterios de aceptación
- [ ] AC-01: El cliente de Supabase está configurado con `flowType: 'pkce'`, `persistSession: true`, `autoRefreshToken: true` y `storageKey` dedicado.
- [ ] AC-02: `GameContext` escucha reactivamente `onAuthStateChange` y no redirige a `/auth` de forma abrupta mientras el token esté refrescándose.
- [ ] AC-03: Al reanudar la app tras suspensión o pérdida de foco, se comprueba y renueva la sesión proactivamente.
- [ ] AC-04: Si un usuario con sesión iniciada visita o retrocede a `/auth`, `/login` o `/registro`, es redirigido automáticamente a `/dashboard` con `replace: true`.
- [ ] AC-05: El inicio de sesión y registro reemplazan la entrada del historial para evitar volver a la pantalla de login con el botón atrás.
- [ ] AC-06: Todos los Quality Gates pasan (`pnpm test`, `pnpm test:bdd`, `pnpm lint`, `pnpm build`).

## 6. Restricciones
- Mantener compatibilidad estricta con todas las pruebas existentes de `tests/ui/authScreen.test.jsx`, `tests/ui/authGoogle.test.jsx` y `tests/ui/appShell.test.jsx`.
- ESLint debe mantenerse con un máximo de 13 advertencias (`--max-warnings=13`).

## 7. Trazabilidad
Manifest: `.agents/workflow/tasks/auth-pwa-session-security.yml`
Plan: `.agents/workflow/plans/auth-pwa-session-security.md`
