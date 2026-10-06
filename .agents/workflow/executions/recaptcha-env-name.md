# Reporte de Ejecución: recaptcha-env-name
- **Rama**: `fix/recaptcha-env-name` | **Estado**: `DONE`
- **Pedido**: Vercel avisa al usar el prefijo VITE_ ("expone el valor al navegador"); el dueño cargó `RECAPTCHA_SITE_KEY`.
- **Seguridad**: la clave del SITIO de reCAPTCHA es pública por diseño (siempre viaja en el navegador): exponerla es seguro. Lo que nunca debe exponerse es la clave secreta, que no se carga en Vercel sino como secreto de las funciones de Supabase.
- **Cambio**: `vite.config.ts` con `envPrefix: ['VITE_', 'RECAPTCHA_SITE_KEY']` (nombre exacto: no expone `RECAPTCHA_SECRET` ni otras); `src/lib/recaptcha.js` lee `RECAPTCHA_SITE_KEY` y cae a `VITE_RECAPTCHA_SITE_KEY`; documento actualizado.
- **Tests**: un caso nuevo en `recaptcha.test.js`; suite completa verde.
