import { QueryClient } from '@tanstack/react-query'

/**
 * Cliente único de TanStack Query para toda la app.
 * - Las pantallas nuevas usan `useQuery` / `useMutation` con este cliente.
 * - `src/utils/cache.js` (queryCache) es un adaptador sobre este mismo cliente: el código existente
 *   sigue funcionando sin cambios y comparte caché, deduplicación y recolección de basura.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // los datos del juego cambian por acciones del DT, no por segundo
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false // evita ráfagas de requests al volver a la pestaña
    }
  }
})
