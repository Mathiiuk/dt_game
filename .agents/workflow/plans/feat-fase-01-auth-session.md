# Plan de Implementación — feat-fase-01-auth-session

## 1. Enfoque General
Evolucionar el subsistema de autenticación de Fase 1 hacia el estándar autoritativo de Fase 2.1 y Fase 3, protegiendo las credenciales, previniendo ataques de fuerza bruta mediante rate limiting, y garantizando la partición de carreras desde el primer acceso.

## 2. Fases de Trabajo
1. **Esquema de Base de Datos**:
   - Incorporar `careers`, `user_sessions` y `security_audit_log` con RLS en `supabase.sql`.
2. **Capa API de Dominio (`src/api/auth.js`)**:
   - Implementar rate limiting (5 intentos, 15 min de bloqueo).
   - Implementar validación de robustez de contraseña.
   - Implementar registro de auditoría de seguridad y provisión de carrera activa.
   - Implementar recuperación de contraseña segura y revocación de sesión.
3. **Capa de Presentación (`src/features/auth/AuthScreen.jsx`)**:
   - Diseñar UI reactiva con modos splash, login, register y forgot_password.
   - Agregar badges de validación de contraseñas en vivo.
   - Añadir avisos y banners de intentos restantes y bloqueo por rate limit.
4. **Verificación y Quality Gates**:
   - Ejecutar `npx agt task:verify feat-fase-01-auth-session`.
   - Sincronizar memoria con `npx agt memory:sync`.
