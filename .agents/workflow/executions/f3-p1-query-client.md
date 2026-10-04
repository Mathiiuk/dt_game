# Reporte de Ejecución: f3-p1-query-client
- **Rama**: `feat/f3-p1-query-client` | **Estado**: `DONE`
- **Decisión de diseño**: en vez de reescribir los ~140 usos de `queryCache`, `src/utils/cache.js` pasa a ser un **adaptador sobre TanStack Query** (`src/lib/queryClient.js`). El código existente no cambia y hereda deduplicación de peticiones en vuelo, TTL por valor y recolección de basura del `QueryClient`; las pantallas del rediseño (Fase 2) usarán `useQuery`/`useMutation` directamente sobre el mismo cliente y la misma caché (claves `['cache', clave]`).
- `App.jsx` envuelve la app en `QueryClientProvider`. Defaults: `staleTime` 30 s, `gcTime` 5 min, `retry` 1, sin refetch al volver a la pestaña.
- Compatibilidad preservada: resultados `null/undefined` no se cachean; `invalidate(prefijo)` y `clear()` equivalentes; `set/get` respetan el TTL.
- **Tests** (31 en total; +3 nuevos de caché: vacíos no cacheados, TTL de `set/get` compartido con `fetch`, error del fetcher sin residuos).
- **Verificación en navegador**: recorrido de 14 rutas con el motor nuevo → 0 respuestas 4xx/5xx y 0 errores de consola.
- Dependencia: `@tanstack/react-query` (instalada con pnpm 11 por el store del `node_modules` local; `package-lock.json` regenerado con npm para CI).
