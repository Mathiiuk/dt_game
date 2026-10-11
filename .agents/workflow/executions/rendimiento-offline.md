# Rendimiento, modo sin conexión y redes lentas

**Medición** (Chromium + CDP, "Slow 4G": 400 kbps / 400 ms, primera visita, build de producción servido en local; métrica = cuándo se ve el formulario de `/login`):

| | Antes | Después |
|---|---|---|
| `/login` formulario visible | 14,9 s | 10,8 s |
| Bytes hasta verlo | 672 KB | 438 KB |
| Precache del service worker | ~100 archivos, ~2,9 MB (incluía 29 HTML públicos e imágenes) | 19 archivos, 1,6 MB |
| Portada `/` (ya prerenderizada) | 0,56 s | 0,55 s |
| 2ª visita | 0,5 s | 0,5 s |

Sin conexión: `/login` vuelve a abrirse tras una visita previa (service worker activo) con el aviso "Sin conexión".

## Cambios
- `vercel.json`: `/assets/*` → `public, max-age=31536000, immutable` (nombres con hash).
- Medidor (GTM, 117 KB): en rutas del juego espera a que la app se dibuje (`vestuario:ready`) o 8 s; en las públicas, a `load` + navegador libre. El consentimiento sigue antes.
- Inicio (`Dashboard`) como trozo aparte, precargado por `AuthScreen` mientras se escribe; `climateApi` cargado por demanda desde `GameContext`.
- Service worker: precache mínimo (`vite.config.ts`) + `CacheFirst` con expiración para `/assets/*.{js,css,woff2}` (`workbox-expiration`, dependencia explícita nueva).
- `src/lib/netFetch.js`: lecturas con tiempo máximo de 15 s y hasta 2 reintentos (502/503/504 o error de red; espera creciente, respeta Retry-After con tope de 5 s, sin esperar si no hay conexión). Las escrituras nunca se cortan ni se reintentan. Aviso de "conexión lenta" si algo tarda más de 4 s.
- Copia de lecturas `/rest/v1` (no RPC ni auth) en Cache Storage (`src/lib/readCache.js`, máx. 150 entradas, 24 h): sin red se devuelve la última copia marcada `x-vestuario-stale`. Se borra al cerrar sesión, al eliminar la cuenta y al entrar otra persona. Mencionado en `/privacidad`.
- `OfflineBanner`: sin conexión / lenta / reconectada, con "Reintentar". Los botones que guardan (Avanzar semana en Inicio y Calendario, Guardar táctica) se desactivan sin red: "Necesitás conexión para esto".

## Tests
`netFetch` (14), `netStatus`, `readCache`, `netBanner`, `loadPerformance` (estático), `vercelRoutes`, `homeSeo`, `calendarScreen` (sin conexión).

## Pendiente
- Jugar o guardar sin conexión (cola de escrituras): cambia el modelo de datos, queda como proyecto aparte.
- Medir en un dispositivo real y con los encabezados reales de Vercel (en local no hay HTTP/2 ni Brotli).
