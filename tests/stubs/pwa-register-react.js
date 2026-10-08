// Sustituto de `virtual:pwa-register/react` para las pruebas (ese módulo lo crea el plugin PWA, que los tests no cargan)
export const useRegisterSW = () => ({
  offlineReady: [false, () => {}],
  needRefresh: [false, () => {}],
  updateServiceWorker: () => {}
})
