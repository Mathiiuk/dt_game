# Seguridad y acceso: qué está hecho y qué tenés que hacer vos

Este documento no tiene claves. Las claves se cargan **solo** en los paneles (Supabase, Vercel, Google, Resend), nunca en el código ni en el chat.

## Qué quedó hecho en el código

| Tema | Qué hace | Dónde |
|---|---|---|
| **reCAPTCHA v3 en el servidor** | Alta, ingreso y recuperar clave pasan por la función `auth-gate`, que verifica el token con la clave secreta, la acción, el dominio y un puntaje mínimo (0,5) antes de tocar la cuenta | `supabase/functions/auth-gate`, `src/lib/recaptcha.js`, `src/api/auth.js` |
| **Ingreso con Google** | Botón "Continuar con Google" en ingreso y alta; la carrera inicial se crea al leer la sesión por primera vez | `src/api/auth.js`, `src/features/auth/AuthScreen.jsx` |
| **Correos con Resend** | Bienvenida desde `no-contestar@vestuario.com.ar` con respuesta a `hola@vestuario.com.ar`, una sola vez por cuenta, siempre al correo de quien tiene la sesión | `supabase/functions/send-email`, `src/api/email.js` |
| **Base cerrada por dueño** | Cada fila pertenece a la cuenta que la creó y solo esa cuenta la ve y la modifica; la clave pública sin sesión no puede tocar nada | `scripts/db/migration_rls_owner_isolation.sql` (**sin aplicar, ver abajo**) |

Sin `VITE_RECAPTCHA_SITE_KEY` la app sigue funcionando por el camino directo (útil en desarrollo). Con la clave puesta, el alta y el ingreso **fallan cerrados**: si la función no responde, no se entra.

## Pasos que tenés que hacer vos (en este orden)

### 1. Cerrar la base (lo bloqueó el sistema de permisos, no lo apliqué)
La migración borra todas las políticas abiertas, agrega la columna `owner_user_id` a todas las tablas de juego y revoca permisos a la clave pública. Está probada solo en teoría: la base ya está vacía (la limpié), así que es el mejor momento.
- Abrila en `scripts/db/migration_rls_owner_isolation.sql`, revisala y pegala en **Supabase > SQL Editor**, o decime que la aplique yo y confirmame en el chat.
- Después hay que hacer un recorrido completo con una cuenta nueva (alta, DT, club, partido, avanzar semana, mercado) para ver que nada se rompe.

### 2. Secretos de las funciones (Supabase > Edge Functions > Secrets)
- `RECAPTCHA_SECRET`: la clave secreta de reCAPTCHA v3.
- `RESEND_API_KEY`: la clave de Resend.
- Opcional: `ALLOWED_ORIGINS` (por defecto: `https://dt-game.vercel.app`, `https://vestuario.com.ar`, `https://www.vestuario.com.ar` y `http://localhost:5173`) y `RECAPTCHA_MIN_SCORE` (0,5 por defecto).

### 3. Desplegar las dos funciones
```bash
npx supabase functions deploy auth-gate --no-verify-jwt --project-ref qozozdaavjfxvssvxqbx
npx supabase functions deploy send-email --project-ref qozozdaavjfxvssvxqbx
```
`auth-gate` va **sin** verificación de JWT porque la llaman personas que todavía no iniciaron sesión (se protege con reCAPTCHA). `send-email` va **con** verificación.

### 4. Variable pública del sitio (Vercel > Settings > Environment Variables)
- `VITE_RECAPTCHA_SITE_KEY`: la clave del sitio (es pública).
- En reCAPTCHA Admin, los dominios permitidos tienen que incluir `dt-game.vercel.app`, `vestuario.com.ar` y `localhost`.

### 5. Google
1. **Reseteá el secreto del cliente en Google Cloud** (el anterior se pegó en el chat) y descartá el archivo `docs/client_secret_*.json`.
2. En Google Cloud, URI de redireccionamiento autorizado: `https://qozozdaavjfxvssvxqbx.supabase.co/auth/v1/callback`.
3. En **Supabase > Authentication > Providers > Google**: activar y cargar el Client ID y el **nuevo** secreto.
4. **Authentication > URL Configuration**: Site URL `https://dt-game.vercel.app` y Redirect URLs `https://dt-game.vercel.app/**` y `http://localhost:5173/**`.

### 6. Correos
- **Resend > Domains**: el dominio `vestuario.com.ar` tiene que figurar como verificado (los registros SPF y DKIM en el DNS).
- Para **enviar** desde `no-contestar@` no hace falta crear ninguna casilla: Resend manda con cualquier dirección del dominio verificado.
- Para **recibir** respuestas en `hola@vestuario.com.ar` sí hace falta una casilla o un reenvío (por ejemplo, reenvío de correo de tu proveedor de DNS). Es un servicio aparte de Resend.
- Para que también los correos de Supabase (confirmar cuenta, recuperar clave) salgan por Resend: **Authentication > SMTP Settings**: host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = tu clave de Resend, remitente `no-contestar@vestuario.com.ar`.

### 7. Ajustes de Supabase pendientes
- **Authentication > Providers > Email**: activar "Confirm email".
- **Authentication > Attack Protection**: activar la protección de contraseñas filtradas.
- **Settings > Database**: rotar la contraseña de la base (la histórica sigue sin rotar).
- **Authentication > Rate Limits**: dejar los valores por defecto o más estrictos.

## Límites que conviene conocer
- **El cálculo del juego sigue en el navegador.** La base aísla a las cuentas entre sí, pero una cuenta todavía puede alterar los datos de su propio club llamando a la API. Los resultados de Copa y fechas FIFA son el próximo candidato a moverse al servidor.
- **reCAPTCHA y el alta directa.** Mientras Supabase permita registrarse por la API pública, alguien puede saltearse la función. La defensa es la confirmación de correo, la protección de contraseñas filtradas y los límites de Supabase; reCAPTCHA v3 no se puede conectar directo al módulo de seguridad de Supabase (solo acepta hCaptcha y Turnstile).
- **Google no pasa por reCAPTCHA.** Las cuentas de Google ya tienen su propia verificación.
