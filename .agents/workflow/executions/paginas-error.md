# Páginas de error: 404 real, pantalla de error y aviso sin conexión

- Roles: frontend-engineer, seo-growth-expert (404 que no se indexa), devops-engineer (vercel.json), qa-engineer (TDD).
- 404 real: `vercel.json` ya no reescribe todo a la app; solo las 29 rutas del juego (`src/data/gameRoutes.js`). Lo demás recibe `dist/404.html` (generado en el prerender con la pantalla de página inexistente, `noindex`, sin canonical) y Vercel responde 404. Un test exige que `gameRoutes.js`, `vercel.json` y `GameApp.jsx` coincidan.
- `NotFoundScreen` ("Esta jugada fue al VAR y no existe") para rutas inexistentes dentro de la app (antes el juego mandaba todo a `/auth`).
- `ErrorBoundary` + pantalla "Se pinchó la pelota" (recargar / volver al inicio), evento `app_error` y gancho `window.__reportError` para Sentry; si el error es de un archivo viejo tras una actualización recarga sola una vez.
- `OfflineBanner`: aviso "Sin conexión" al perder internet.
- Gates: lint sin avisos, 1880 tests, 70 escenarios BDD y build con 404.html.
- Verificar en producción tras el merge: `curl -I https://www.vestuario.com.ar/no-existe` debe dar 404; `/dashboard`, `/auth` y `/game` siguen cargando la app.
