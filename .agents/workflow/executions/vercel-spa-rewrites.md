# Reporte de Ejecución: vercel-spa-rewrites
- **Rama**: `fix/vercel-spa-rewrites` | **Estado**: `DONE`
- **Síntoma**: `https://dt-game.vercel.app/` responde 200 pero `/auth` (y cualquier ruta de React Router, o un refresh en ellas) devuelve `404 NOT_FOUND` de Vercel. Verificado con `curl` (200 vs 404).
- **Causa**: es una SPA (BrowserRouter) y el proyecto no tenía `vercel.json`; Vercel busca un archivo físico `/auth` que no existe.
- **Fix**: `vercel.json` con rewrite `/(.*)` → `/index.html` (los archivos físicos como `/assets/*` y `/sw.js` siguen sirviéndose primero), `Cache-Control: must-revalidate` para `index.html` y `sw.js` (evita que la PWA quede con una versión vieja) y framework/build explícitos.
- **Nota**: las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` deben estar definidas en Vercel (Project Settings > Environment Variables), porque `.env.local` no se sube. Además, en Supabase > Auth > URL Configuration hay que agregar `https://dt-game.vercel.app` como Site URL / Redirect URL (necesario para Google Login).
