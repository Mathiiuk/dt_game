# Ejecución: actualizaciones seguras por versión

- Rama: `feat/actualizaciones-seguras`. Roles: frontend-engineer, devops-engineer, qa-engineer (TDD). Decisión del usuario: **nunca exigir actualizar** (siempre aviso suave).
- **Versión visible:** `package.json` pasa a 1.0.0; el build inyecta `__APP_VERSION__` (versión + commit corto de Vercel) y `__APP_BUILD_TIME__`; "Más" muestra "versión X". No se manda como cabecera a Supabase: un encabezado propio puede romper el CORS de la API.
- **Actualizar sin romper:** `updateGuard.js` + `busy.js`. `ReloadPrompt` ofrece "Actualizar ahora" solo fuera de `/match` y `/post-match` y sin algo a medias (pizarra con cambios sin guardar, historia abierta); si hay una actualización pendiente se instala sola al cambiar de sección en un momento seguro; "Después" la deja pendiente.
- **Pestañas con código viejo:** `vite:preloadError` se convierte en un evento que muestra el aviso (y recarga en un momento seguro); `ErrorBoundary` conserva la recarga única si la pantalla no puede cargar.
- **Datos locales:** `storageMigrations.js` (versión 1 = base; migraciones numeradas, idempotentes, sin tocar claves desconocidas, un paso fallido no bloquea). Corre antes de dibujar la app (`main.jsx`).
- **Novedades:** `data/changelog.js` + `WhatsNew` (una vez por persona; cuentas nuevas arrancan al día; no aparece en un partido ni con algo a medias).
- **Regla de compatibilidad:** `.agents/rules/safe-releases.md` (cambios de base aditivos, funciones nuevas en vez de cambiar firmas, migraciones de datos locales, marcar lo pendiente).
- Pruebas: `updateGuard`, `storageMigrations`, `staleVersion`, `changelog`, `reloadPrompt`, `whatsNew`.
- Pendiente de revisión humana: ver el aviso en un celular con la app instalada y una versión anterior (requiere publicar dos versiones seguidas).
