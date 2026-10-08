# Implementation Plan — auth-pwa-session-security

## 1. Resumen
Implementar una solución de seguridad y persistencia de sesión de extremo a extremo:
1. Configuración de cliente Supabase con PKCE y storage persistente aislado en `src/api/supabase.js`.
2. Gestión reactiva de sesión con `onAuthStateChange` y refresco proactivo ante reconexión/focus en `src/context/GameContext.jsx`.
3. Auto-detección de sesión activa y resolución de retroceso en `src/features/auth/AuthScreen.jsx`.
4. Manejo de navegación sin acumulación de páginas de login en el historial del navegador (`replace: true`).
5. Pruebas unitarias y escenarios BDD de persistencia y prevención de deslogueo en PWA.

## 2. Repositorio inspeccionado
- Stack: React 19, Vite 8, Tailwind CSS v4, Supabase JS v2, TanStack Query, Vitest, Cucumber.
- Runtime: Node.js (Windows).
- Package manager: pnpm.
- Branch base: `feat/arcade-match-squad-polish-escudos-vectoriales-arcade-fixes-de-encoding-mejoras-interactivas-en-match-post-match-desktop-y-rediseno-de-squad`.

## 3. Cambios propuestos

### [MODIFY]
- `src/api/supabase.js`: Configurar opciones de `auth` (`persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, `storageKey: 'dt_supabase_auth_token'`, `flowType: 'pkce'`).
- `src/api/auth.js`: Agregar función de comprobación de sesión rápida y resiliente, re-intento de refresco ante fallas transitorias de red y gestión de `visibilitychange`.
- `src/context/GameContext.jsx`: Suscripción a `onAuthStateChange`, control de estado de reanudación y prevención de redirección abrupta a `/auth`.
- `src/features/auth/AuthScreen.jsx`: Detección en montaje de usuario ya autenticado, redirección inmediata a `/dashboard` con `replace: true`.
- `src/features/auth/WelcomeScreen.jsx`: Navegación con `replace: true` hacia el dashboard.
- `src/components/layout/AppShell.jsx`: Control de navegación de retroceso en la ruta raíz del Dashboard.
- `.agents/workflow/tasks/auth-pwa-session-security.yml`: Metadatos y Quality Gates.
- `.agents/workflow/tests/auth-pwa-session-security.md`: Plan de pruebas y evidencia.
- `.agents/workflow/features/auth-pwa-session-security.feature`: Especificación BDD.

### [NEW]
- `tests/bdd/steps/auth-pwa-session-security.steps.js`: Pasos ejecutables para BDD.
- `tests/ui/authPersistence.test.jsx`: Pruebas de persistencia, retroceso y ciclo de vida de sesión.

## 4. Estrategia de implementación
1. **Paso 1:** Configurar `src/api/supabase.js` con las opciones de auth seguras y persistentes.
2. **Paso 2:** Modificar `src/api/auth.js` incorporando `setupAutoSessionRefresh()` para refrescar la sesión cada vez que el usuario vuelve a la pestaña o abre la PWA (`visibilitychange` / `focus`).
3. **Paso 3:** Actualizar `src/context/GameContext.jsx` para escuchar `supabase.auth.onAuthStateChange` y evitar que fallas transitorias de red provoquen deslogueo.
4. **Paso 4:** Actualizar `src/features/auth/AuthScreen.jsx` para que si un usuario autenticado llega a `/auth` o presiona "Atrás", detecte la sesión y lo reingrese al juego de inmediato con `replace: true`.
5. **Paso 5:** Validar navegaciones con `replace: true` en login, registro y bienvenida.
6. **Paso 6:** Escribir tests unitarios y pasos BDD.
7. **Paso 7:** Ejecutar Quality Gates (`pnpm test`, `pnpm test:bdd`, `pnpm lint`, `pnpm build`, `agt task:verify`).

## 5. Seguridad
- Flujo PKCE activado para mitigar ataques de interceptación de código de autorización.
- Rate limiting protegido en `localStorage`.
- No almacenamiento de contraseñas en texto plano ni logs.

## 6. Definition of Done
- 0 deslogueos al salir o poner la app en segundo plano.
- El botón de retroceso no atrapa al usuario en el login si ya tiene sesión.
- 100% Quality Gates en verde.
