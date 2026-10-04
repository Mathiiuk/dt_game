# Especificación — feat-fase-01-auth-session

## 1. Objetivo
Implementar la arquitectura autoritativa de autenticación, gestión de sesiones, recuperación segura de acceso y aislamiento estricto de carreras (Career Partitioning) según el contrato de dominio de la Fase 01 de *Del Potrero al Ídolo*.

## 2. Problema actual
La implementación previa de autenticación carecía de rate limiting, carecía de validación interactiva de robustez de contraseña, no disponía de flujo de recuperación de contraseña con anti-enumeración de usuarios, ni integraba el particionado explícito de carreras ni auditoría de seguridad.

## 3. Resultado esperado
1. Validación de fortaleza de contraseña en tiempo real (mínimo 8 caracteres, al menos 1 número, al menos 1 mayúscula/símbolo).
2. Rate limiting autoritativo en cliente/servidor (5 intentos fallidos máx antes de bloqueo de 15 minutos).
3. Modo de recuperación de contraseñas con mensaje anti-enumeración.
4. Esquemas de base de datos para `user_sessions`, `careers` y `security_audit_log` con políticas RLS y fallbacks seguros.
5. Experiencia de usuario enriquecida en `AuthScreen.jsx` con iconos de `lucide-react`, estética visual oscura y cero emojis en crudo.

## 4. Alcance

### Incluido
- Módulo `src/api/auth.js` reforzado con `checkRateLimit`, `validatePasswordStrength`, `register`, `login`, `logout`, `requestPasswordReset`, `getSession`.
- Pantalla `src/features/auth/AuthScreen.jsx` con soporte para modos `splash`, `login`, `register` y `forgot_password`.
- Esquema SQL en `supabase.sql` para tablas `careers`, `user_sessions` y `security_audit_log`.

### No incluido
- Integración con proveedores OAuth externos (Google/Apple), reservada para fases posteriores.

## 5. Criterios de aceptación
- [x] AC-01: Registro exige y valida en tiempo real contraseñas de al menos 8 caracteres con números y mayúsculas/símbolos.
- [x] AC-02: Inicio de sesión bloquea temporalmente por 15 min tras 5 intentos fallidos y muestra advertencia con intentos restantes.
- [x] AC-03: Flujo de recuperación de contraseñas no revela la existencia de cuentas y emite evento de auditoría.
- [x] AC-04: Cierre de sesión revoca sesiones activas y limpia la memoria caché SWR (`queryCache.clear()`).
- [x] AC-05: El build de producción pasa 100% verde sin errores.

## 6. Restricciones
- Cumplimiento de las Master Rules 3.0.
- Cero emojis en crudo (solo iconos SVG de Lucide).

## 7. Dependencias
- `@supabase/supabase-js`, `lucide-react`, `sonner`, `src/utils/cache.js`.

## 8. Trazabilidad
- Manifiesto: `.agents/workflow/tasks/feat-fase-01-auth-session.yml`
- Contrato de dominio: `docs/Del_Potrero_al_Idolo_Fase_2_1/01_inicio_sesion/01_inicio_sesion_2.1.md`
