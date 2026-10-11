/// <reference lib="webworker" />
// Service worker de Vestuario: guarda el juego para usarlo sin conexión (Workbox) y muestra los avisos push.
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { parsePushPayload, targetUrl } from './lib/pushPayload'

self.skipWaiting = self.skipWaiting.bind(self)

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
clientsClaim()

// Pantallas, estilos y fuentes que no vienen en el precache: se guardan la primera vez que se piden. Los nombres llevan hash
// (el contenido nunca cambia con el mismo nombre), así que se sirven de la copia sin preguntar a la red; las viejas se descartan solas.
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && /^\/assets\/.+\.(js|css|woff2)$/.test(url.pathname),
  new CacheFirst({
    cacheName: 'vestuario-assets-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 30 * 24 * 3600, purgeOnQuotaError: true })]
  })
)

// Navegación: siempre la app (para el juego), salvo los archivos para buscadores, que se piden a la red
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/robots\.txt$/, /^\/sitemap\.xml$/] }))

// La actualización se instala solo cuando la app lo pide (en un momento seguro: ver src/lib/updateGuard.js)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('push', (event) => {
  const message = parsePushPayload(event.data)
  if (!message) return
  event.waitUntil(self.registration.showNotification(message.title, {
    body: message.body,
    tag: message.tag,
    icon: '/pwa-icon.svg',
    badge: '/pwa-icon.svg',
    data: { url: message.url }
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = targetUrl(event.notification.data, self.location.origin)
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    // Si el juego ya está abierto, se lo trae al frente y se lo lleva a la pantalla del aviso; si no, se abre
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(url)
        return
      }
    }
    await self.clients.openWindow(url)
  })())
})
