# FASE 1 — INICIO DE SESIÓN

## Objetivo
Permitir entrar al juego con la mínima fricción.

## Pantallas
1. Splash.
2. Inicio.
3. Registro.
4. Login.
5. Recuperación.
6. Continuar carrera.

## Inicio
Mostrar:
- Logo.
- Nombre del juego.
- Nueva carrera.
- Continuar.
- Configuración.

Si no existe carrera: `Nueva carrera`.
Si existe: `Continuar`.

## Registro
Campos:
- Nombre.
- Email.
- Contraseña.
- Confirmación.

Validar:
- Email válido.
- Contraseña segura.
- Email único.
- Confirmación coincidente.

## Login
- Email.
- Contraseña.
- Mantener sesión.
- Recuperar contraseña.

## Seguridad
- Contraseñas con hash seguro.
- Sesiones/token con expiración.
- Rate limiting.
- Validación backend.
- No confiar en datos enviados por frontend.

## UX
No mostrar pantallas vacías.
Errores específicos.
Estados de carga claros.
Tras autenticarse, llevar directamente a creación/continuación de carrera.
