# Plan de Pruebas — feat-fase-01-auth-session

## 1. Casos de Prueba Verificados

### Caso 1: Validación de Robustez de Contraseña
- Contraseña débil (< 8 caracteres, sin números) es rechazada con mensaje explicativo.
- Contraseña robusta (8+ caracteres, número y mayúscula/símbolo) es aceptada.

### Caso 2: Rate Limiting y Bloqueo Temporal
- Tras 5 intentos fallidos consecutivos con credenciales erróneas, el sistema bloquea los accesos por 15 minutos e informa los minutos restantes.

### Caso 3: Anti-Enumeración en Recuperación de Acceso
- La solicitud de restablecimiento de contraseña responde de forma unificada y segura sin confirmar si el correo existe en la base de datos.

### Caso 4: Revocación de Sesión y Purga de Caché
- El cierre de sesión marca la sesión como revocada y ejecuta `queryCache.clear()`.

### Caso 5: Compilación y Build
- `npm run build` genera el bundle de producción sin fallos de compilación ni dependencias rotas.
