# FASE 1 — INICIO DE SESIÓN
# FASE 2.1 — PROFUNDIZACIÓN DE DOMINIO

## 1. Objetivo
Establecer el contrato funcional y formal de dominio para la autenticación, gestión de identidad, recuperación de acceso, integridad de sesiones y aislamiento estricto de carreras en *Del Potrero al Ídolo*. Garantizar que el backend sea la autoridad absoluta de identidad y acceso, protegiendo las carreras contra accesos no autorizados y estados inconsistentes.

## 2. Alcance específico
- Autenticación de usuarios (registro, login, logout, refresh token, recuperación de contraseña).
- Gestión de identidad de jugador humano vs identificadores de carrera/DT.
- Ciclo de vida de la sesión activa y contexto de juego.
- Separación y aislamiento estricto entre carreras (Career Partitioning).
- Control de seguridad, rate limiting y prevención de accesos simultáneos conflictivos.

## 3. Entidades y Modelo de Datos de Dominio
1. **UserAccount (`auth.users` / `users`)**:
   - `id` (UUID, PK): Identificador inmutable de la cuenta de usuario.
   - `email` (String, Unique): Correo electrónico normalizado en minúsculas.
   - `encrypted_password` (String): Hash criptográfico seguro (Argon2id o bcrypt, gestionado por servidor).
   - `role` (Enum: `PLAYER`, `ADMIN`, `SUPPORT`): Rol del usuario en el sistema.
   - `status` (Enum: `ACTIVE`, `SUSPENDED`, `PENDING_VERIFICATION`): Estado de la cuenta.
   - `last_sign_in_at` (Timestamp UTC): Último inicio de sesión registrado.
   - `created_at`, `updated_at` (Timestamp UTC).

2. **UserSession (`user_sessions`)**:
   - `id` (UUID, PK): Identificador unívoco del token de sesión.
   - `user_id` (UUID, FK -> `users.id`): Usuario propietario.
   - `device_fingerprint` (String): Hash identificador del cliente/navegador.
   - `ip_address` (Inet): Dirección IP de conexión.
   - `active_career_id` (UUID, Nullable, FK -> `careers.id`): Carrera actualmente cargada en sesión.
   - `expires_at` (Timestamp UTC): Fecha de expiración forzosa.
   - `is_revoked` (Boolean): Bandera de invalidación inmediata.

3. **CareerContext (`careers`)**:
   - `id` (UUID, PK): Identificador global único de la carrera (aislamiento total de mundo).
   - `user_id` (UUID, FK -> `users.id`): Propietario de la carrera.
   - `status` (Enum: `ACTIVE`, `COMPLETED`, `ABANDONED`, `CORRUPTED`): Estado de la partida.
   - `ruleset_version` (String): Versión de reglas maestras activas al crear la partida (ej: "3.0.0").
   - `balance_version` (String): Versión del catálogo de balance en uso.
   - `created_at`, `last_accessed_at` (Timestamp UTC).

4. **SecurityAuditEvent (`security_audit_log`)**:
   - `id` (UUID, PK): Identificador del registro.
   - `user_id` (UUID, Nullable): Usuario involucrado.
   - `event_type` (Enum: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_RESET_REQ`, `PASSWORD_RESET_DONE`, `SESSION_REVOKED`, `RATE_LIMIT_EXCEEDED`).
   - `ip_address`, `user_agent` (String).
   - `payload` (JSONB): Detalles técnicos estructurados sin credenciales.
   - `created_at` (Timestamp UTC).

## 4. Máquina de Estados
### Ciclo de Vida de Sesión
```
[NO_AUTENTICADO] 
       │ 
       ├── (Command: Login con credenciales válidas) ────────► [AUTENTICADO_SIN_CARRERA]
       │                                                             │
       │                                                             ├── (Command: Seleccionar/Crear Carrera) ──► [EN_CARRERA_ACTIVA]
       │                                                             │                                                   │
       │                                                             ◄── (Command: Deseleccionar Carrera) ───────────────┘
       │                                                             │
       ├── (Command: Logout / Expiración / Revocación) ◄──────────────┴──────────────────────────────────────────────────┘
       ▼
[SESIÓN_REVOCADA]
```

### Transiciones Formales
1. **Transición T-01: Autenticación Exitosa**
   - **Actor:** Usuario anónimo.
   - **Precondiciones:** Cuenta en estado `ACTIVE`, email y contraseña coincidentes, IP no bloqueada por rate limit.
   - **Comando:** `AuthenticateUser(email, password, clientMeta)`.
   - **Consecuencias:** Generación de JWT + Refresh Token con claims de rol, inserción en `user_sessions`, emisión de evento `USER_LOGGED_IN`.
   - **Idempotencia:** Solicitudes concurrentes con idénticas credenciales devuelven tokens independientes válidos o unifican según política de concurrencia.
   - **Errores:** `ERR_INVALID_CREDENTIALS`, `ERR_ACCOUNT_SUSPENDED`, `ERR_RATE_LIMIT_EXCEEDED`.

2. **Transición T-02: Carga de Contexto de Carrera**
   - **Actor:** Usuario autenticado.
   - **Precondiciones:** Sesión válida, carrera perteneciente al `user_id` autenticado, carrera en estado `ACTIVE`.
   - **Comando:** `AttachCareerToSession(sessionId, careerId)`.
   - **Consecuencias:** Se asocia `active_career_id` al contexto del backend. Toda consulta subsecuente queda acotada mediante RLS al `career_id`.
   - **Errores:** `ERR_CAREER_NOT_FOUND`, `ERR_UNAUTHORIZED_CAREER_ACCESS`.

3. **Transición T-03: Cierre de Sesión (Logout)**
   - **Actor:** Usuario autenticado.
   - **Precondiciones:** Sesión existente.
   - **Comando:** `RevokeSession(sessionId)`.
   - **Consecuencias:** Marca `is_revoked = true` en `user_sessions`, invalida refresh token en Redis/BD, borra cookies seguras.
   - **Idempotencia:** Si ya está revocada, responde exitosamente (no-op).

## 5. Flujo Funcional Paso a Paso
1. **Ingreso:** El cliente solicita inicio de sesión enviando email y contraseña por canal cifrado TLS 1.3.
2. **Validación Autoritaria:** El servidor valida formato, aplica rate limit por IP/email (máximo 5 intentos por minuto), verifica hash de contraseña contra la base de datos.
3. **Emisión de Credenciales:** El servidor crea la sesión con expiración estricta (Access Token 15 min, Refresh Token 7 días) con flags `HttpOnly`, `Secure`, `SameSite=Strict`.
4. **Verificación de Carrera:** El backend consulta si el usuario tiene un DT activo. Si no lo tiene, responde con código `REQUIRE_WIZARD_DT`. Si lo tiene, carga el `career_id` activo.
5. **Auditoría:** Se registra la entrada en `security_audit_log`.
6. **Respuesta al Cliente:** Se envía la proyección mínima del usuario (ID, email, nombre de DT si existe, carrera activa si existe).

## 6. Reglas Específicas
- **Regla 1.1 — Aislamiento Criptográfico de Carreras:** Un usuario bajo ninguna circunstancia puede consultar, mutar o listar entidades que pertenezcan a un `career_id` diferente al asociado en su token de sesión verificado por RLS en PostgreSQL.
- **Regla 1.2 — Backend Autoridad en Tiempos:** La expiración de sesiones no depende del reloj del navegador. El servidor descarta cualquier token cuyo `exp` haya caducado según UTC de base de datos.
- **Regla 1.3 — Credenciales Seguras:** Passwords requieren mínimo 8 caracteres, al menos 1 número y 1 símbolo. No se permite almacenamiento en texto plano bajo ninguna circunstancia.
- **Regla 1.4 — Invalidación en Cascada:** Al cambiar contraseña o pulsar "Cerrar sesión en todos los dispositivos", todas las sesiones activas en `user_sessions` para dicho `user_id` son marcadas como `is_revoked = true`.

## 7. Balance y Configuración Parametrizable
Catálogo versionado en backend (`auth_config.json`):
- `max_failed_attempts_before_lock`: 5 intentos.
- `lockout_duration_minutes`: 15 minutos.
- `access_token_ttl_seconds`: 900 (15 minutos).
- `refresh_token_ttl_days`: 7 días.
- `max_active_sessions_per_user`: 3 sesiones concurrentes.
- `password_reset_token_ttl_minutes`: 30 minutos.

## 8. Política de Información (Visible / Oculta)
- **Visible al Cliente:** Email del usuario, estado de la cuenta, fecha de último acceso, identificador de DT y club actual, historial de sesiones activas (dispositivo, ubicación aproximada, hora).
- **Parcial:** Ninguna.
- **Oculta al Cliente (Estrictamente privada):** Password hashes, salts, reset tokens en texto plano, device fingerprints internos, registros de auditoría de seguridad del sistema.

## 9. Inteligencia Artificial / Bots
Los clubes y entidades de IA no poseen credenciales de usuario ni sesiones humanas. Son simuladas en workers de servidor dentro del mismo `career_id` sin credenciales de red públicas.

## 10. Eventos y Auditoría
- `USER_REGISTERED`: Registro de nueva cuenta.
- `USER_LOGGED_IN`: Inicio de sesión exitoso.
- `USER_LOGIN_FAILED`: Intento fallido (registra motivo: contraseña errónea, cuenta bloqueada, email inexistente).
- `USER_LOGGED_OUT`: Cierre de sesión voluntario.
- `PASSWORD_RESET_REQUESTED`: Solicitud de recuperación.
- `PASSWORD_RESET_COMPLETED`: Contraseña actualizada.
- `SESSION_REVOKED_SECURITY`: Revocación forzosa por detección anómala.

## 11. Idempotencia y Mitigación de Errores de Red
- Endpoints de login y refresh token deben ser idempotentes ante reintentos de red. Si una petición con el mismo requestId llega en ventana de 2 segundos, devuelve la misma respuesta en proceso sin recalcular hash costoso.
- El logout repetido devuelve HTTP 200 OK garantizando que la sesión queda en estado cerrado.

## 12. Concurrencia
- Si el usuario inicia sesión desde un nuevo dispositivo y supera `max_active_sessions_per_user`, el backend revoca automáticamente la sesión más antigua (FIFO).
- Transacciones de sesión utilizan aislamiento de lectura confirmada (`READ COMMITTED`) con bloqueos a nivel de fila (`SELECT ... FOR UPDATE`) sobre la cuenta para evitar race conditions en contadores de intentos fallidos.

## 13. Persistencia y Ciclo de Vida
- Las cuentas de usuario son permanentes hasta solicitud expresa de baja (GDPR/Derecho al olvido).
- Las sesiones revocadas o expiradas se purgan tras 30 días mediante job programado.
- Los logs de auditoría de seguridad se conservan de forma inmutable durante al menos 12 meses.

## 14. Experiencia de Usuario (UX)
- **¿Dónde estoy?:** Pantalla de bienvenida / Login con estética de vestuario profesional.
- **¿Qué puedo hacer?:** Ingresar con email/contraseña, solicitar recuperación de clave o registrar nueva cuenta.
- **¿Qué cuesta?:** Gratuito, sólo consume 1 intento de login.
- **¿Qué puede pasar?:** Al acertar, ingreso directo al juego; al errar 5 veces, bloqueo preventivo temporal de 15 minutos.
- **¿Qué ocurrió?:** Notificaciones inline accesibles con feedback inmediato (ej: "Contraseña incorrecta. Te quedan 2 intentos").

## 15. Casos Extremos
- **Cuenta suspendida:** Intento de login devuelve mensaje claro de contacto a soporte sin revelar detalles técnicos.
- **Pérdida de red durante login:** El cliente reintenta con backoff exponencial sin duplicar tokens de sesión en cliente.
- **Token expirado en pleno uso:** El cliente intercepta el 401 y ejecuta silenciosamente el refresh token. Si falla, redirige amigablemente al login preservando la ruta previa en memoria.

## 16. Anti-Exploits
- Protección contra Timing Attacks en comparación de credenciales usando `crypto.timingSafeEqual`.
- Rate limiting por IP y por cuenta mediante token bucket en backend.
- Prevención de Enumeración de Usuarios: El mensaje de recuperación de contraseña y de login fallido no revela si el email está registrado o no ("Si la dirección existe, recibirás un enlace de recuperación").
- Bloqueo absoluto de manipulación de claims de JWT: La firma criptográfica HMAC-SHA256 / RS256 es verificada en cada petición.

## 17. Observabilidad y Métricas
- Tasa de éxito de logins (% logins exitosos vs intentos fallidos).
- Frecuencia de bloqueos temporales por rate limit.
- P95 y P99 de latencia en hash y validación de contraseñas.
- Número de sesiones activas simultáneas globales.

## 18. Matriz de Pruebas
1. Registro con email válido y contraseña robusta -> HTTP 201 y usuario creado en BD.
2. Login con contraseña errónea -> HTTP 401 y contador de fallos incrementado.
3. 5 logins fallidos consecutivos -> HTTP 429 / Cuenta bloqueada por 15 minutos.
4. Refresh token con token válido -> HTTP 200 y nuevo access token emitido.
5. Acceso con token manipulado en payload -> HTTP 403 Forbidden inmediato.
6. Aislamiento RLS: Un usuario con token válido no puede leer datos de carreras ajenas.

## 19. Criterios de Aceptación
- [x] Estados definidos formalmente.
- [x] Transiciones documentadas con precondiciones y consecuencias.
- [x] Reglas de backend autoritativo cerradas.
- [x] Información visible, parcial y oculta categorizada.
- [x] Entorno de IA delimitado y excluido de sesiones web.
- [x] Eventos de auditoría de seguridad tipificados.
- [x] Idempotencia y control de duplicación cubiertos.
- [x] Concurrencia de sesiones y bloqueos gestionados.
- [x] Balance de rate limit y tiempos parametrizable.
- [x] Casos extremos y errores contemplados.
- [x] Anti-exploits y seguridad criptográfica definidos.
- [x] Matriz de pruebas formalizada.
- [x] Contrato con Fase 3 establecido sin ambigüedades.

## 20. Contrato hacia Fase 3 (Arquitectura e Implementación)
- **Módulos Requeridos:** `AuthService`, `SessionRepository`, `TokenManager`, `SecurityAuditService`.
- **Comandos:** `LoginCommand`, `RegisterCommand`, `RefreshTokenCommand`, `RevokeSessionCommand`, `ResetPasswordCommand`.
- **Queries:** `GetActiveSessionQuery`, `ValidateTokenQuery`.
- **Políticas DB:** RLS habilitado en todas las tablas con cláusula `WHERE career_id = current_setting('app.current_career_id')::uuid`.
