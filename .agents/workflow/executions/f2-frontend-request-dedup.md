# Reporte de Ejecución: f2-frontend-request-dedup

- **Rama**: `fix/f2-frontend-request-dedup` | **Estado**: `DONE`
- `ManagerCareerScreen.jsx` y `NationalTeamScreen.jsx` pasan sus cargas por `queryCache.fetch` (TTL 5 s) con invalidación (`force`) tras mutaciones (aceptar/rechazar oferta, renunciar, jugar partido).
- Medición en navegador (dev, cuenta de prueba): `/manager` pasó de **20** a **11** requests en carga fría (`manager_job_offers` 4→2, `manager_career_stints` 4→1, `clubs` 6→3). El resto del doble disparo es React StrictMode en desarrollo.
- `npm run build` no ejecutable en este entorno (SWC rechaza el directorio de caché por ACL de Windows); la verificación se hizo con el servidor Vite del navegador (compila los archivos modificados sin errores).
